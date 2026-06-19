/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

/**
 * E2E smoke: GET /api/user/search-zone/suggest (Phase T1 #98).
 * Requires dev server; MAPBOX_ACCESS_TOKEN or GOOGLE_MAPS_GEOCODING_API_KEY optional for live suggest.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeaders(session: string): { cookie: string } {
	return { cookie: `session=${session}` };
}

async function main(): Promise<void> {
	const hasMapboxToken = Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim());
	const hasGoogleKey = Boolean(process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim());
	const hasProviderCredentials = hasMapboxToken || hasGoogleKey;

	const unauthenticated = await fetch(`${baseUrl}/api/user/search-zone/suggest?q=Terr`);
	if (unauthenticated.status !== 401) {
		console.error("❌ unauthenticated suggest expected 401", unauthenticated.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated suggest → 401");

	const shortQueryUnauth = await fetch(`${baseUrl}/api/user/search-zone/suggest?q=a`);
	if (shortQueryUnauth.status !== 401) {
		console.error("❌ short query without session expected 401", shortQueryUnauth.status);
		process.exit(1);
	}

	const email = `verify-place-suggest-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Place Suggest User", email, password }),
	});

	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user failed", register.status);
		process.exit(1);
	}

	console.log("✅ user session ready");

	const shortQuery = await fetch(`${baseUrl}/api/user/search-zone/suggest?q=a`, {
		headers: sessionHeaders(userCookie),
	});
	const shortBody = (await shortQuery.json()) as { suggestions?: unknown[] };

	if (shortQuery.status !== 200 || !Array.isArray(shortBody.suggestions) || shortBody.suggestions.length !== 0) {
		console.error("❌ short query expected empty suggestions", shortQuery.status, shortBody);
		process.exit(1);
	}

	console.log("✅ q shorter than 2 chars → { suggestions: [] }");

	const suggest = await fetch(`${baseUrl}/api/user/search-zone/suggest?q=Terr&limit=3`, {
		headers: sessionHeaders(userCookie),
	});
	const suggestBody = (await suggest.json()) as {
		suggestions?: Array<{ label?: string; latitude?: number; longitude?: number }>;
		error?: { description?: string };
	};

	if (hasProviderCredentials) {
		if (
			suggest.status !== 200 ||
			!Array.isArray(suggestBody.suggestions) ||
			suggestBody.suggestions.length === 0 ||
			typeof suggestBody.suggestions[0]?.label !== "string" ||
			typeof suggestBody.suggestions[0]?.latitude !== "number"
		) {
			console.error("❌ live suggest failed", suggest.status, suggestBody);
			process.exit(1);
		}

		console.log(`✅ live suggest returned ${suggestBody.suggestions.length} result(s)`);
	} else if (suggest.status === 503) {
		console.log("✅ suggest → 503 without geocoding credentials (expected)");
	} else {
		console.error("❌ expected 200 with provider credentials or 503 without", suggest.status, suggestBody);
		process.exit(1);
	}

	console.log("✅ verify:search-zone-place-suggest passed");
}

void main();
