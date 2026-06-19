/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

/**
 * E2E smoke: GET /api/user/search-zone/map-client-config (Phase T2 #99).
 * Requires dev server; Mapbox pk or Google JS/geocoding key optional for live config.
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

function hasInteractiveMapCredentials(): boolean {
	const mapboxPublic =
		process.env.MAPBOX_PUBLIC_ACCESS_TOKEN?.trim() ??
		process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
	const mapboxPkFallback = process.env.MAPBOX_ACCESS_TOKEN?.trim()?.startsWith("pk.")
		? process.env.MAPBOX_ACCESS_TOKEN.trim()
		: undefined;
	const googleKey =
		process.env.GOOGLE_MAPS_JS_API_KEY?.trim() ??
		process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim();

	return Boolean(mapboxPublic || mapboxPkFallback || googleKey);
}

async function main(): Promise<void> {
	const hasCredentials = hasInteractiveMapCredentials();

	const unauthenticated = await fetch(`${baseUrl}/api/user/search-zone/map-client-config`);
	if (unauthenticated.status !== 401) {
		console.error("❌ unauthenticated map-client-config expected 401", unauthenticated.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated map-client-config → 401");

	const email = `verify-map-config-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Map Config User", email, password }),
	});

	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user failed", register.status);
		process.exit(1);
	}

	console.log("✅ user session ready");

	const response = await fetch(`${baseUrl}/api/user/search-zone/map-client-config`, {
		headers: sessionHeaders(userCookie),
	});
	const body = (await response.json()) as {
		provider?: string;
		publicToken?: string;
		language?: string;
		error?: { description?: string };
	};

	if (hasCredentials) {
		if (
			response.status !== 200 ||
			(body.provider !== "mapbox" && body.provider !== "google") ||
			typeof body.publicToken !== "string" ||
			body.publicToken.length === 0 ||
			body.publicToken.startsWith("sk.")
		) {
			console.error("❌ live map-client-config failed", response.status, body);
			process.exit(1);
		}

		console.log(`✅ live map-client-config provider=${body.provider}`);
	} else if (response.status === 503) {
		console.log("✅ map-client-config → 503 without map credentials (expected)");
	} else {
		console.error("❌ expected 200 with credentials or 503 without", response.status, body);
		process.exit(1);
	}

	console.log("✅ verify:interactive-map-client-config passed");
}

void main();
