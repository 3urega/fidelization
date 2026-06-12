/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

/**
 * E2E: GET /api/user/establishments paginated list for platform user.
 * Requires dev server + DATABASE_URL.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const email = `verify-discover-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Discover User", email, password }),
	});

	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user failed");
		process.exit(1);
	}

	const headers = { cookie: `session=${userCookie}` };

	const unauth = await fetch(`${baseUrl}/api/user/establishments`);
	if (unauth.status !== 401) {
		console.error("❌ unauthenticated should be 401:", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated → 401");

	const page0 = await fetch(`${baseUrl}/api/user/establishments?page=0&limit=2`, { headers });
	const page0Body = (await page0.json()) as {
		establishments?: { id: string; name: string; slug: string; logoUrl: string | null }[];
		hasMore?: boolean;
	};

	if (
		!page0.ok ||
		!Array.isArray(page0Body.establishments) ||
		page0Body.establishments.length === 0 ||
		!page0Body.establishments[0]?.slug
	) {
		console.error("❌ GET page 0:", page0.status, page0Body);
		process.exit(1);
	}

	console.log(`✅ GET page 0 → ${page0Body.establishments.length} establishments`);

	if (page0Body.hasMore) {
		const page1 = await fetch(`${baseUrl}/api/user/establishments?page=1&limit=2`, { headers });
		const page1Body = (await page1.json()) as {
			establishments?: { slug: string }[];
		};

		if (!page1.ok || !Array.isArray(page1Body.establishments)) {
			console.error("❌ GET page 1:", page1.status, page1Body);
			process.exit(1);
		}

		const overlap = page1Body.establishments.some((row) =>
			page0Body.establishments?.some((first) => first.slug === row.slug),
		);

		if (overlap) {
			console.error("❌ page 1 overlaps page 0");
			process.exit(1);
		}

		console.log("✅ GET page 1 without overlap");
	}

	const initialBatch = await fetch(`${baseUrl}/api/user/establishments?offset=0&limit=6`, { headers });
	const initialBatchBody = (await initialBatch.json()) as {
		establishments?: { slug: string }[];
		hasMore?: boolean;
	};

	if (
		!initialBatch.ok ||
		!Array.isArray(initialBatchBody.establishments) ||
		initialBatchBody.establishments.length === 0 ||
		initialBatchBody.establishments.length > 6
	) {
		console.error("❌ GET offset 0 limit 6:", initialBatch.status, initialBatchBody);
		process.exit(1);
	}

	console.log(`✅ GET offset 0 limit 6 → ${initialBatchBody.establishments.length} establishments`);

	if (initialBatchBody.hasMore) {
		const nextOffset = initialBatchBody.establishments.length;
		const nextBatch = await fetch(
			`${baseUrl}/api/user/establishments?offset=${nextOffset}&limit=4`,
			{ headers },
		);
		const nextBatchBody = (await nextBatch.json()) as {
			establishments?: { slug: string }[];
		};

		if (!nextBatch.ok || !Array.isArray(nextBatchBody.establishments)) {
			console.error("❌ GET offset next limit 4:", nextBatch.status, nextBatchBody);
			process.exit(1);
		}

		const initialSlugs = new Set(initialBatchBody.establishments.map((row) => row.slug));
		const offsetOverlap = nextBatchBody.establishments.some((row) => initialSlugs.has(row.slug));

		if (offsetOverlap) {
			console.error("❌ offset batch overlaps initial batch");
			process.exit(1);
		}

		console.log(`✅ GET offset ${nextOffset} limit 4 without overlap`);
	}

	const home = await fetch(`${baseUrl}/home`, { headers, redirect: "manual" });
	if (home.status !== 200) {
		console.error("❌ GET /home:", home.status);
		process.exit(1);
	}

	console.log("✅ GET /home loads for discover grid shell");
	console.log("✅ verify:platform-app-discover-establishments passed");
}

void main();
