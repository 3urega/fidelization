/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

/**
 * E2E smoke: /home/profile shell + tabs (Phase S2 #94).
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

function sessionHeaders(session: string): { cookie: string } {
	return { cookie: `session=${session}` };
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const email = `verify-profile-shell-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Profile Shell User", email, password }),
	});

	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user failed", register.status);
		process.exit(1);
	}

	console.log("✅ user session ready");

	const me = await fetch(`${baseUrl}/api/user/me`, {
		headers: sessionHeaders(userCookie),
	});
	const meBody = (await me.json()) as { user?: { searchZone?: unknown } };

	if (!me.ok || meBody.user?.searchZone !== null) {
		console.error("❌ GET /api/user/me should include searchZone null", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/user/me searchZone null initially");

	const profile = await fetch(`${baseUrl}/home/profile`, {
		headers: sessionHeaders(userCookie),
	});
	const profileHtml = await profile.text();

	if (
		profile.status !== 200 ||
		!profileHtml.includes("Tu perfil") ||
		!profileHtml.includes("Información personal") ||
		!profileHtml.includes("Mis tarjetas")
	) {
		console.error("❌ GET /home/profile shell missing copy", profile.status);
		process.exit(1);
	}

	console.log("✅ GET /home/profile shell OK");

	const tarjetasTab = await fetch(`${baseUrl}/home/profile?tab=tarjetas`, {
		headers: sessionHeaders(userCookie),
	});
	const tarjetasHtml = await tarjetasTab.text();

	if (tarjetasTab.status !== 200 || !tarjetasHtml.includes("Próximamente")) {
		console.error("❌ GET /home/profile?tab=tarjetas missing placeholder", tarjetasTab.status);
		process.exit(1);
	}

	console.log("✅ tarjetas tab placeholder OK");

	const patchZone = await fetch(`${baseUrl}/api/user/me/search-zone`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({
			label: "Terrassa, Barcelona",
			latitude: 41.5639,
			longitude: 2.0084,
		}),
	});

	if (!patchZone.ok) {
		console.error("❌ PATCH search-zone failed", patchZone.status, await patchZone.text());
		process.exit(1);
	}

	const profileWithZone = await fetch(`${baseUrl}/home/profile`, {
		headers: sessionHeaders(userCookie),
	});
	const zoneHtml = await profileWithZone.text();

	if (profileWithZone.status !== 200 || !zoneHtml.includes("Terrassa, Barcelona")) {
		console.error("❌ profile should show saved search zone label");
		process.exit(1);
	}

	console.log("✅ profile shows saved search zone after PATCH");

	const unauthenticated = await fetch(`${baseUrl}/home/profile`, { redirect: "manual" });

	if (unauthenticated.status !== 307 && unauthenticated.status !== 308) {
		console.error("❌ unauthenticated /home/profile should redirect", unauthenticated.status);
		process.exit(1);
	}

	const location = unauthenticated.headers.get("location") ?? "";
	if (!location.includes("/login")) {
		console.error("❌ expected redirect to /login", location);
		process.exit(1);
	}

	console.log("✅ unauthenticated redirect to login");

	const home = await fetch(`${baseUrl}/home`, { headers: sessionHeaders(userCookie) });
	const homeHtml = await home.text();

	if (home.status !== 200 || !homeHtml.includes("Perfil")) {
		console.error("❌ /home should link to Perfil", home.status);
		process.exit(1);
	}

	console.log("✅ /home Perfil link OK");
	console.log("✅ verify:platform-user-profile-shell passed");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
