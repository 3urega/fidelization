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

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const platformSession = await platformLogin();
	const platformCookie = { cookie: `session=${platformSession}` };

	const unauthorized = await fetch(`${baseUrl}/api/platform/moderation/reports?status=open`, {
		headers: platformCookie,
	});

	if (unauthorized.status !== 401) {
		// Without cookie
	}

	const noSession = await fetch(`${baseUrl}/api/platform/moderation/reports?status=open`);

	if (noSession.status !== 401) {
		console.error("❌ GET reports without session should be 401", noSession.status);
		process.exit(1);
	}

	console.log("✅ GET reports without platform session → 401");

	const summaryBefore = await fetch(`${baseUrl}/api/platform/moderation/summary`, {
		headers: platformCookie,
	});
	const summaryBeforeBody = (await summaryBefore.json()) as { openCount?: number };

	if (summaryBefore.status !== 200 || typeof summaryBeforeBody.openCount !== "number") {
		console.error("❌ GET summary", summaryBefore.status, summaryBeforeBody);
		process.exit(1);
	}

	console.log("✅ GET moderation summary");

	const openListEmpty = await fetch(`${baseUrl}/api/platform/moderation/reports?status=open`, {
		headers: platformCookie,
	});
	const openListEmptyBody = (await openListEmpty.json()) as {
		reports?: unknown[];
		total?: number;
	};

	if (
		openListEmpty.status !== 200 ||
		!Array.isArray(openListEmptyBody.reports) ||
		typeof openListEmptyBody.total !== "number"
	) {
		console.error("❌ GET open reports", openListEmpty.status, openListEmptyBody);
		process.exit(1);
	}

	console.log("✅ GET open reports list (empty OK)");

	const superadmin = await prisma.user.findFirst({
		where: { platformRole: "superadmin" },
		select: { id: true },
	});

	if (!superadmin) {
		console.error("❌ superadmin user not found");
		process.exit(1);
	}

	const tenant = await prisma.tenant.findFirst({
		where: { status: "active" },
		select: { id: true, name: true },
	});

	if (!tenant) {
		console.error("❌ active tenant not found");
		process.exit(1);
	}

	const resolveReportId = randomUUID();
	const suspendReportId = randomUUID();

	await prisma.moderationReport.createMany({
		data: [
			{
				id: resolveReportId,
				reporterUserId: superadmin.id,
				targetType: "tenant",
				targetId: tenant.id,
				reason: "Verify resolve report",
				status: "open",
			},
			{
				id: suspendReportId,
				reporterUserId: superadmin.id,
				targetType: "tenant",
				targetId: tenant.id,
				reason: "Verify suspend tenant report",
				status: "open",
			},
		],
	});

	const summaryWithReports = await fetch(`${baseUrl}/api/platform/moderation/summary`, {
		headers: platformCookie,
	});
	const summaryWithReportsBody = (await summaryWithReports.json()) as { openCount?: number };

	if (
		summaryWithReports.status !== 200 ||
		typeof summaryWithReportsBody.openCount !== "number" ||
		summaryWithReportsBody.openCount < summaryBeforeBody.openCount! + 2
	) {
		console.error("❌ summary after seed", summaryWithReports.status, summaryWithReportsBody);
		process.exit(1);
	}

	console.log("✅ summary reflects seeded open reports");

	const openList = await fetch(`${baseUrl}/api/platform/moderation/reports?status=open`, {
		headers: platformCookie,
	});
	const openListBody = (await openList.json()) as {
		reports?: { id?: string; targetLabel?: string; tenantId?: string }[];
	};

	if (
		openList.status !== 200 ||
		!openListBody.reports?.some((row) => row.id === resolveReportId) ||
		!openListBody.reports?.some((row) => row.id === suspendReportId)
	) {
		console.error("❌ seeded reports missing from open list", openList.status, openListBody);
		process.exit(1);
	}

	const seededRow = openListBody.reports?.find((row) => row.id === resolveReportId);

	if (!seededRow?.targetLabel || seededRow.tenantId !== tenant.id) {
		console.error("❌ enriched report row", seededRow);
		process.exit(1);
	}

	console.log("✅ open list includes enriched seeded reports");

	const resolve = await fetch(
		`${baseUrl}/api/platform/moderation/reports/${resolveReportId}/resolve`,
		{
			method: "PATCH",
			headers: platformCookie,
		},
	);
	const resolveBody = (await resolve.json()) as {
		report?: { id?: string; status?: string };
	};

	if (
		resolve.status !== 200 ||
		resolveBody.report?.id !== resolveReportId ||
		resolveBody.report.status !== "resolved"
	) {
		console.error("❌ resolve report", resolve.status, resolveBody);
		process.exit(1);
	}

	console.log("✅ PATCH resolve marks report resolved");

	const doubleResolve = await fetch(
		`${baseUrl}/api/platform/moderation/reports/${resolveReportId}/resolve`,
		{
			method: "PATCH",
			headers: platformCookie,
		},
	);
	const doubleResolveBody = (await doubleResolve.json()) as { error?: { type?: string } };

	if (doubleResolve.status !== 409 || doubleResolveBody.error?.type !== "ModerationReportAlreadyResolved") {
		console.error("❌ double resolve", doubleResolve.status, doubleResolveBody);
		process.exit(1);
	}

	console.log("✅ already resolved → 409");

	await prisma.tenant.update({
		where: { id: tenant.id },
		data: { status: "active" },
	});

	const suspend = await fetch(
		`${baseUrl}/api/platform/moderation/reports/${suspendReportId}/suspend-tenant`,
		{
			method: "POST",
			headers: platformCookie,
		},
	);
	const suspendBody = (await suspend.json()) as {
		report?: { status?: string };
		tenant?: { id?: string; status?: string };
	};

	if (
		suspend.status !== 200 ||
		suspendBody.report?.status !== "resolved" ||
		suspendBody.tenant?.id !== tenant.id ||
		suspendBody.tenant.status !== "suspended"
	) {
		console.error("❌ suspend tenant from report", suspend.status, suspendBody);
		process.exit(1);
	}

	const tenantRow = await prisma.tenant.findUnique({
		where: { id: tenant.id },
		select: { status: true },
	});

	if (tenantRow?.status !== "suspended") {
		console.error("❌ tenant not suspended in database", tenantRow);
		process.exit(1);
	}

	console.log("✅ POST suspend-tenant suspends tenant and resolves report");

	await prisma.tenant.update({
		where: { id: tenant.id },
		data: { status: "active" },
	});

	console.log("✅ platform admin moderation E2E verified");
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
