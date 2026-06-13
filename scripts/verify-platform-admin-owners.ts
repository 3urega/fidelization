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

	const list = await fetch(`${baseUrl}/api/platform/owners`, { headers: platformCookie });
	const listBody = (await list.json()) as {
		owners?: {
			userId?: string;
			name?: string;
			email?: string;
			businesses?: { tenantId?: string; slug?: string }[];
		}[];
		total?: number;
		hasMore?: boolean;
		offset?: number;
		limit?: number;
	};

	if (
		list.status !== 200 ||
		!Array.isArray(listBody.owners) ||
		listBody.total === undefined ||
		listBody.hasMore === undefined
	) {
		console.error("❌ GET /api/platform/owners", list.status, listBody);
		process.exit(1);
	}

	if (listBody.owners.length === 0) {
		console.error("❌ expected at least one owner in demo data");
		process.exit(1);
	}

	const firstOwner = listBody.owners[0];
	if (!firstOwner?.businesses?.length || !firstOwner.businesses[0]?.slug) {
		console.error("❌ owner missing businesses[]", firstOwner);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/owners → owners with businesses");

	const searchEmail = firstOwner.email ?? "";
	const search = await fetch(
		`${baseUrl}/api/platform/owners?q=${encodeURIComponent(searchEmail)}`,
		{ headers: platformCookie },
	);
	const searchBody = (await search.json()) as { owners?: { email?: string }[]; total?: number };

	if (
		search.status !== 200 ||
		searchBody.total !== 1 ||
		searchBody.owners?.[0]?.email !== searchEmail
	) {
		console.error("❌ search by owner email", search.status, searchBody);
		process.exit(1);
	}

	console.log("✅ search ?q= filters by email");

	const unauth = await fetch(`${baseUrl}/api/platform/owners`);

	if (unauth.status !== 401) {
		console.error("❌ unauthenticated owners expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated → 401");

	const email = `verify-owners-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Owners Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation", register.status);
		process.exit(1);
	}

	const userOwners = await fetch(`${baseUrl}/api/platform/owners`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userOwners.status !== 401) {
		console.error("❌ user session must not list owners, got", userOwners.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on owners");

	const ownersPage = await fetch(`${baseUrl}/platform/owners`, {
		headers: platformCookie,
	});

	if (ownersPage.status !== 200) {
		console.error("❌ GET /platform/owners page expected 200, got", ownersPage.status);
		process.exit(1);
	}

	const ownersHtml = await ownersPage.text();
	if (!ownersHtml.includes("Comerciantes") || !ownersHtml.includes("Negocios")) {
		console.error("❌ owners page missing expected table headers");
		process.exit(1);
	}

	console.log("✅ GET /platform/owners page OK");
	console.log("✅ verify:platform-admin-owners passed");
}

void main();
