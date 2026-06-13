/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

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
	const platformSession = await platformLogin();
	const platformCookie = { cookie: `session=${platformSession}` };

	const list = await fetch(`${baseUrl}/api/platform/users`, { headers: platformCookie });
	const listBody = (await list.json()) as {
		users?: {
			userId?: string;
			name?: string;
			email?: string;
			qrValue?: string | null;
			establishmentsCount?: number;
			lastTransactionAt?: string | null;
		}[];
		total?: number;
		hasMore?: boolean;
		filter?: string;
	};

	if (
		list.status !== 200 ||
		!Array.isArray(listBody.users) ||
		listBody.total === undefined ||
		listBody.hasMore === undefined ||
		listBody.filter !== "all"
	) {
		console.error("❌ GET /api/platform/users", list.status, listBody);
		process.exit(1);
	}

	if (listBody.users.length === 0) {
		console.error("❌ expected at least one app user in demo data");
		process.exit(1);
	}

	const superadminInList = listBody.users.some(
		(user) => user.email?.toLowerCase() === superadminEmail.toLowerCase(),
	);
	if (superadminInList) {
		console.error("❌ superadmin must not appear in app users list");
		process.exit(1);
	}

	console.log("✅ GET /api/platform/users → app users without superadmin");

	const firstUser = listBody.users[0];
	if (!firstUser?.userId || !firstUser.email) {
		console.error("❌ user row missing userId/email", firstUser);
		process.exit(1);
	}

	const withEstablishments = await fetch(
		`${baseUrl}/api/platform/users?filter=with_establishments`,
		{ headers: platformCookie },
	);
	const withEstablishmentsBody = (await withEstablishments.json()) as {
		users?: { establishmentsCount?: number }[];
		filter?: string;
	};

	if (
		withEstablishments.status !== 200 ||
		withEstablishmentsBody.filter !== "with_establishments" ||
		withEstablishmentsBody.users?.some((user) => (user.establishmentsCount ?? 0) < 1)
	) {
		console.error("❌ with_establishments filter", withEstablishments.status, withEstablishmentsBody);
		process.exit(1);
	}

	console.log("✅ filter=with_establishments");

	const search = await fetch(
		`${baseUrl}/api/platform/users?q=${encodeURIComponent(firstUser.email)}`,
		{ headers: platformCookie },
	);
	const searchBody = (await search.json()) as { users?: { email?: string }[]; total?: number };

	if (
		search.status !== 200 ||
		searchBody.total !== 1 ||
		searchBody.users?.[0]?.email !== firstUser.email
	) {
		console.error("❌ search by email", search.status, searchBody);
		process.exit(1);
	}

	console.log("✅ search ?q= filters by email");

	const detail = await fetch(`${baseUrl}/api/platform/users/${firstUser.userId}`, {
		headers: platformCookie,
	});
	const detailBody = (await detail.json()) as {
		userId?: string;
		qrValue?: string | null;
		establishments?: unknown[];
		recentTransactions?: unknown[];
		generatedAt?: string;
	};

	if (
		detail.status !== 200 ||
		detailBody.userId !== firstUser.userId ||
		!detailBody.qrValue ||
		!Array.isArray(detailBody.establishments) ||
		!Array.isArray(detailBody.recentTransactions) ||
		!detailBody.generatedAt
	) {
		console.error("❌ GET /api/platform/users/[userId]", detail.status, detailBody);
		process.exit(1);
	}

	console.log("✅ detail includes qrValue after ensure");

	const unauth = await fetch(`${baseUrl}/api/platform/users`);

	if (unauth.status !== 401) {
		console.error("❌ unauthenticated users expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated → 401");

	const email = `verify-app-users-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "App Users Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation", register.status);
		process.exit(1);
	}

	const userList = await fetch(`${baseUrl}/api/platform/users`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userList.status !== 401) {
		console.error("❌ user session must not list app users, got", userList.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on app users");

	const usersPage = await fetch(`${baseUrl}/platform/users`, {
		headers: platformCookie,
	});

	if (usersPage.status !== 200) {
		console.error("❌ GET /platform/users page expected 200, got", usersPage.status);
		process.exit(1);
	}

	const usersHtml = await usersPage.text();
	if (
		!usersHtml.includes("Clientes") ||
		!usersHtml.includes("Todos") ||
		!usersHtml.includes("Última transacción")
	) {
		console.error("❌ users page missing expected table headers");
		process.exit(1);
	}

	console.log("✅ GET /platform/users page OK");
	console.log("✅ verify:platform-admin-app-users passed");
}

void main();
