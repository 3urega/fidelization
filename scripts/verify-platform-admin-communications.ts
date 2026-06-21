/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function platformLogin(): Promise<string> {
	const response = await fetch(`${baseUrl}/api/platform/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: superadminEmail, password: superadminPassword }),
	});

	const session = parseSessionCookie(response.headers.get("set-cookie"));

	if (!response.ok || !session) {
		console.error("❌ platform login failed", response.status);
		process.exit(1);
	}

	return session;
}

async function countBroadcasts(): Promise<number> {
	return prisma.platformBroadcast.count();
}

async function main(): Promise<void> {
	const beforeCount = await countBroadcasts();
	const platformSession = await platformLogin();
	const platformCookie = { cookie: `session=${platformSession}` };

	const unauthorized = await fetch(`${baseUrl}/api/platform/communications/broadcasts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			channel: "email",
			audienceType: "all_owners",
			subject: "Test",
			body: "Body",
			confirmed: false,
		}),
	});

	if (unauthorized.status !== 401) {
		console.error("❌ POST without session should be 401", unauthorized.status);
		process.exit(1);
	}

	console.log("✅ POST without platform session → 401");

	const preview = await fetch(`${baseUrl}/api/platform/communications/broadcasts`, {
		method: "POST",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({
			channel: "email",
			audienceType: "all_owners",
			subject: "Verify preview",
			body: "Preview body",
			confirmed: false,
		}),
	});
	const previewBody = (await preview.json()) as {
		preview?: boolean;
		recipientCount?: number;
		sampleRecipients?: unknown[];
	};

	if (
		preview.status !== 200 ||
		previewBody.preview !== true ||
		typeof previewBody.recipientCount !== "number" ||
		previewBody.recipientCount < 1 ||
		!Array.isArray(previewBody.sampleRecipients)
	) {
		console.error("❌ preview broadcast", preview.status, previewBody);
		process.exit(1);
	}

	const afterPreviewCount = await countBroadcasts();

	if (afterPreviewCount !== beforeCount) {
		console.error("❌ preview should not persist broadcasts", beforeCount, afterPreviewCount);
		process.exit(1);
	}

	console.log("✅ preview returns recipient count without persistence");

	const subject = `Verify broadcast ${randomUUID().slice(0, 8)}`;
	const send = await fetch(`${baseUrl}/api/platform/communications/broadcasts`, {
		method: "POST",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({
			channel: "email",
			audienceType: "all_owners",
			subject,
			body: "Confirmed broadcast body",
			confirmed: true,
		}),
	});
	const sendBody = (await send.json()) as {
		broadcast?: {
			id?: string;
			subject?: string;
			status?: string;
			recipientCount?: number;
		};
	};

	if (
		send.status !== 201 ||
		!sendBody.broadcast?.id ||
		sendBody.broadcast.subject !== subject ||
		sendBody.broadcast.status !== "sent" ||
		typeof sendBody.broadcast.recipientCount !== "number" ||
		sendBody.broadcast.recipientCount < 1
	) {
		console.error("❌ confirm broadcast", send.status, sendBody);
		process.exit(1);
	}

	const deliveryCount = await prisma.platformBroadcastDelivery.count({
		where: { broadcastId: sendBody.broadcast.id },
	});

	if (deliveryCount !== sendBody.broadcast.recipientCount) {
		console.error("❌ delivery rows mismatch", deliveryCount, sendBody.broadcast.recipientCount);
		process.exit(1);
	}

	console.log("✅ confirmed broadcast persists audit rows");

	const list = await fetch(`${baseUrl}/api/platform/communications/broadcasts?limit=5`, {
		headers: platformCookie,
	});
	const listBody = (await list.json()) as {
		broadcasts?: { id?: string; subject?: string }[];
		total?: number;
	};

	if (
		list.status !== 200 ||
		!Array.isArray(listBody.broadcasts) ||
		typeof listBody.total !== "number" ||
		!listBody.broadcasts.some((row) => row.id === sendBody.broadcast?.id)
	) {
		console.error("❌ GET broadcasts list", list.status, listBody);
		process.exit(1);
	}

	console.log("✅ GET broadcasts list includes recent send");

	const invalid = await fetch(`${baseUrl}/api/platform/communications/broadcasts`, {
		method: "POST",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({
			channel: "email",
			audienceType: "tenant",
			subject: "Missing tenant",
			body: "Body",
			confirmed: false,
		}),
	});
	const invalidBody = (await invalid.json()) as { error?: { type?: string } };

	if (invalid.status !== 400 || invalidBody.error?.type !== "InvalidPlatformBroadcast") {
		console.error("❌ tenant audience validation", invalid.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ invalid tenant audience → 400");

	console.log("✅ platform admin communications E2E verified");
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
