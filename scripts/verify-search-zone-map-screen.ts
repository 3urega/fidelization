/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

/**
 * Phase U2 E2E: dedicated map screen `/home/map`, PATCH search zone, optional suggest (#107).
 * Requires dev server + DATABASE_URL.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const TERRASSA_LAT = 41.5639;
const TERRASSA_LNG = 2.0084;

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
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const hasProviderCredentials =
		Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim()) ||
		Boolean(process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim());

	const email = `verify-map-screen-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Map Screen User", email, password }),
	});

	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user failed", register.status);
		process.exit(1);
	}

	const headers = sessionHeaders(userCookie);

	console.log("✅ user session ready");

	const unauthenticated = await fetch(`${baseUrl}/home/map`, { redirect: "manual" });
	if (unauthenticated.status !== 307 && unauthenticated.status !== 308) {
		console.error("❌ unauthenticated /home/map should redirect", unauthenticated.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated /home/map → redirect");

	const mapPage = await fetch(`${baseUrl}/home/map`, { headers });
	const mapHtml = await mapPage.text();

	if (mapPage.status !== 200 || !mapHtml.includes("Mapa")) {
		console.error("❌ GET /home/map shell", mapPage.status);
		process.exit(1);
	}

	console.log("✅ GET /home/map accessible with user session");

	const patch = await fetch(`${baseUrl}/api/user/me/search-zone`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({
			label: "Terrassa, Barcelona",
			latitude: TERRASSA_LAT,
			longitude: TERRASSA_LNG,
		}),
	});

	if (!patch.ok) {
		console.error("❌ PATCH search-zone failed", patch.status, await patch.text());
		process.exit(1);
	}

	const me = await fetch(`${baseUrl}/api/user/me`, { headers });
	const meBody = (await me.json()) as {
		user?: { searchZone?: { label?: string; latitude?: number } | null };
	};

	if (!me.ok || meBody.user?.searchZone?.label !== "Terrassa, Barcelona") {
		console.error("❌ GET /api/user/me missing saved zone after map flow", meBody);
		process.exit(1);
	}

	console.log("✅ PATCH search zone from map screen flow");

	const suggest = await fetch(`${baseUrl}/api/user/search-zone/suggest?q=Terr&limit=3`, { headers });
	const suggestBody = (await suggest.json()) as {
		suggestions?: unknown[];
	};

	if (hasProviderCredentials) {
		if (suggest.status !== 200 || !Array.isArray(suggestBody.suggestions)) {
			console.error("❌ suggest with credentials", suggest.status, suggestBody);
			process.exit(1);
		}

		console.log("✅ GET search-zone/suggest OK with geocoding credentials");
	} else if (suggest.status === 503) {
		console.log("✅ suggest → 503 without geocoding credentials (expected)");
	} else {
		console.error("❌ expected 200 with credentials or 503 without", suggest.status, suggestBody);
		process.exit(1);
	}

	console.log("✅ verify:search-zone-map-screen passed");
}

void main();
