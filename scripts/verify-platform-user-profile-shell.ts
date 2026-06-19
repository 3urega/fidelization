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

	const registerBody = (await register.json()) as { kind?: string; error?: { description?: string } };
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));
	if (register.status !== 201 || registerBody.kind !== "user" || !userCookie) {
		console.error("❌ register user failed", register.status, registerBody);
		process.exit(1);
	}

	console.log("✅ user session ready");

	const me = await fetch(`${baseUrl}/api/user/me`, {
		headers: sessionHeaders(userCookie),
	});
	const meContentType = me.headers.get("content-type") ?? "";
	if (!me.ok || !meContentType.includes("application/json")) {
		console.error("❌ GET /api/user/me failed", me.status, meContentType);
		process.exit(1);
	}
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
		!profileHtml.includes("Mis tarjetas") ||
		!profileHtml.includes("Zona de búsqueda") ||
		!profileHtml.includes("/home/map") ||
		!profileHtml.includes("Establecer zona en el mapa")
	) {
		console.error("❌ GET /home/profile shell missing copy", profile.status);
		process.exit(1);
	}

	if (
		profileHtml.includes("Confirmar zona") ||
		profileHtml.includes("Buscar con geocodificación")
	) {
		console.error("❌ profile should not embed search zone editor");
		process.exit(1);
	}

	console.log("✅ GET /home/profile shell OK (summary + link to map)");

	const tarjetasTab = await fetch(`${baseUrl}/home/profile?tab=tarjetas`, {
		headers: sessionHeaders(userCookie),
	});
	const tarjetasHtml = await tarjetasTab.text();

	if (tarjetasTab.status !== 200 || !tarjetasHtml.includes("Mis tarjetas")) {
		console.error("❌ GET /home/profile?tab=tarjetas missing tab shell", tarjetasTab.status);
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

	const meWithZone = await fetch(`${baseUrl}/api/user/me`, {
		headers: sessionHeaders(userCookie),
	});
	const meWithZoneBody = (await meWithZone.json()) as {
		user?: { searchZone?: { label?: string } | null };
	};

	if (
		!meWithZone.ok ||
		meWithZoneBody.user?.searchZone?.label !== "Terrassa, Barcelona"
	) {
		console.error("❌ GET /api/user/me should return saved search zone", meWithZoneBody);
		process.exit(1);
	}

	console.log("✅ search zone persisted after PATCH");

	const profileWithZone = await fetch(`${baseUrl}/home/profile`, {
		headers: sessionHeaders(userCookie),
	});

	if (profileWithZone.status !== 200) {
		console.error("❌ profile should load with saved zone session", profileWithZone.status);
		process.exit(1);
	}

	console.log("✅ profile loads with saved search zone session");

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

	if (
		home.status !== 200 ||
		!homeHtml.includes("Ver en el mapa") ||
		!homeHtml.includes("/home/map") ||
		!homeHtml.includes('aria-label="Perfil"') ||
		!homeHtml.includes("/home/profile") ||
		homeHtml.includes(">Perfil</")
	) {
		console.error("❌ /home should show map link and profile icon (not text Perfil)", home.status);
		process.exit(1);
	}

	console.log("✅ /home header map link + profile icon OK");
	console.log("✅ verify:platform-user-profile-shell passed");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
