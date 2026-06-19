/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { GeocodeUserSearchZoneQuery } from "../src/contexts/identity/users/application/profile/GeocodeUserSearchZoneQuery";
import { GeocodeAddressString } from "../src/contexts/shared/geocoding/application/geocode/GeocodeAddressString";
import { Coordinates } from "../src/contexts/shared/geocoding/domain/Coordinates";
import { GeocodingGateway } from "../src/contexts/shared/geocoding/domain/GeocodingGateway";
import { InvalidGeocodingAddress } from "../src/contexts/shared/geocoding/domain/InvalidGeocodingAddress";
import { resolveStaticMapCredentials } from "../src/lib/tenant/buildTenantGeocodingStaticMapUrl";

const TERRASSA_LAT = 41.5639;
const TERRASSA_LNG = 2.0084;

/**
 * Domain + E2E: user search zone geocode editor (Phase S3 #95).
 * Requires dev server + DATABASE_URL for E2E; MAPBOX_ACCESS_TOKEN optional for live geocode.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

class TerrassaStubGeocodingGateway extends GeocodingGateway {
	async geocodeAddress(_address: string): Promise<Coordinates> {
		return Coordinates.fromPrimitives({
			latitude: TERRASSA_LAT,
			longitude: TERRASSA_LNG,
		});
	}
}

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

async function runDomainTests(): Promise<void> {
	const useCase = new GeocodeUserSearchZoneQuery(
		new GeocodeAddressString(new TerrassaStubGeocodingGateway()),
	);

	const result = await useCase.execute({ query: "  Terrassa, Barcelona  " });

	if (
		result.label !== "Terrassa, Barcelona" ||
		result.latitude !== TERRASSA_LAT ||
		result.longitude !== TERRASSA_LNG
	) {
		console.error("❌ GeocodeUserSearchZoneQuery stub result", result);
		process.exit(1);
	}

	console.log("✅ GeocodeUserSearchZoneQuery returns label + coordinates");

	try {
		await useCase.execute({ query: "   " });
		console.error("❌ empty query should throw InvalidGeocodingAddress");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidGeocodingAddress)) {
			console.error("❌ empty query wrong error", error);
			process.exit(1);
		}
	}

	console.log("✅ empty query → InvalidGeocodingAddress");
}

async function runE2eTests(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for E2E");
		process.exit(1);
	}

	const email = `verify-search-zone-editor-${randomUUID()}@example.local`;
	const password = "password123";
	const hasMapboxToken = Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim());
	const hasMapCredentials = resolveStaticMapCredentials() !== null;

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Search Zone Editor User", email, password }),
	});

	const registerBody = (await register.json()) as { kind?: string };
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
	if (register.status !== 201 || registerBody.kind !== "user" || !userCookie) {
		console.error("❌ register user failed", register.status, registerBody);
		process.exit(1);
	}

	console.log("✅ user session ready");

	const unauthGeocode = await fetch(`${baseUrl}/api/user/search-zone/geocode`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: "Terrassa, Barcelona" }),
	});

	if (unauthGeocode.status !== 401) {
		console.error("❌ unauthenticated geocode expected 401", unauthGeocode.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated geocode → 401");

	const emptyGeocode = await fetch(`${baseUrl}/api/user/search-zone/geocode`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ query: "   " }),
	});

	if (emptyGeocode.status !== 400) {
		console.error("❌ empty geocode query expected 400", emptyGeocode.status);
		process.exit(1);
	}

	console.log("✅ empty geocode query → 400");

	const geocode = await fetch(`${baseUrl}/api/user/search-zone/geocode`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ query: "Terrassa, Barcelona" }),
	});
	const geocodeBody = (await geocode.json()) as {
		label?: string;
		latitude?: number;
		longitude?: number;
	};

	if (hasMapboxToken) {
		if (
			geocode.status !== 200 ||
			geocodeBody.label !== "Terrassa, Barcelona" ||
			typeof geocodeBody.latitude !== "number" ||
			typeof geocodeBody.longitude !== "number"
		) {
			console.error("❌ live geocode failed", geocode.status, geocodeBody);
			process.exit(1);
		}

		console.log("✅ POST /api/user/search-zone/geocode live OK");
	} else if (geocode.status === 503) {
		console.log("✅ POST geocode → 503 without MAPBOX_ACCESS_TOKEN (expected)");
	} else {
		console.error("❌ expected 200 with token or 503 without", geocode.status, geocodeBody);
		process.exit(1);
	}

	const nonsenseGeocode = await fetch(`${baseUrl}/api/user/search-zone/geocode`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ query: "zzzznotaplace99999xyz" }),
	});

	if (hasMapboxToken) {
		if (nonsenseGeocode.status !== 422) {
			console.error("❌ nonsense geocode expected 422", nonsenseGeocode.status);
			process.exit(1);
		}

		console.log("✅ nonsense geocode → 422");
	}

	const patch = await fetch(`${baseUrl}/api/user/me/search-zone`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
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

	const me = await fetch(`${baseUrl}/api/user/me`, { headers: sessionHeaders(userCookie) });
	const meBody = (await me.json()) as {
		user?: { searchZone?: { label?: string; latitude?: number; longitude?: number } | null };
	};

	if (
		!me.ok ||
		meBody.user?.searchZone?.label !== "Terrassa, Barcelona" ||
		meBody.user.searchZone.latitude !== TERRASSA_LAT
	) {
		console.error("❌ GET /api/user/me missing saved zone", meBody);
		process.exit(1);
	}

	console.log("✅ PATCH + GET /api/user/me confirm saved zone");

	if (hasMapCredentials) {
		const mapPreview = await fetch(
			`${baseUrl}/api/user/search-zone/map-preview?latitude=${TERRASSA_LAT}&longitude=${TERRASSA_LNG}`,
			{ headers: sessionHeaders(userCookie) },
		);
		const contentType = mapPreview.headers.get("content-type") ?? "";

		if (mapPreview.status !== 200 || !contentType.startsWith("image/")) {
			console.error("❌ map preview expected image", mapPreview.status, contentType);
			process.exit(1);
		}

		console.log("✅ GET map-preview returns image");
	} else {
		console.log("ℹ️ skipping map-preview image check (static map credentials not configured)");
	}

	const profile = await fetch(`${baseUrl}/home/profile`, { headers: sessionHeaders(userCookie) });
	const profileHtml = await profile.text();

	if (
		profile.status !== 200 ||
		!profileHtml.includes("Tu perfil") ||
		!profileHtml.includes("Información personal")
	) {
		console.error("❌ profile shell missing expected copy", profile.status);
		process.exit(1);
	}

	console.log("✅ GET /home/profile shell OK (editor UI hydrates client-side)");
	console.log("✅ verify:platform-user-search-zone-editor passed");
}

async function main(): Promise<void> {
	await runDomainTests();
	await runE2eTests();
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
