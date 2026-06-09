/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

/**
 * E2E check: platform app public home + user register/login UI flow (issue #39).
 * Requires dev server at NEXT_PUBLIC_API_URL (default http://localhost:3000) on apex.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSetCookieSession(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeader(cookie: string): { cookie: string } {
	return { cookie: `session=${cookie}` };
}

async function main(): Promise<void> {
	const email = `verify-platform-u-${randomUUID()}@example.local`;
	const password = "password123";
	const name = "Verify Platform User";

	const homePublic = await fetch(`${baseUrl}/u`);
	if (homePublic.status !== 200) {
		console.error("❌ GET /u:", homePublic.status);
		process.exit(1);
	}

	const homeHtml = await homePublic.text();
	for (const text of ["Registrarse", "Registrar negocio", "Iniciar sesión"]) {
		if (!homeHtml.includes(text)) {
			console.error(`❌ GET /u: expected "${text}" in HTML`);
			process.exit(1);
		}
	}

	if (!homeHtml.includes("/u/register/business")) {
		console.error("❌ GET /u: expected link to /u/register/business");
		process.exit(1);
	}

	console.log("✅ GET /u OK — CTAs presentes");

	const registerPage = await fetch(`${baseUrl}/u/register`);
	if (registerPage.status !== 200) {
		console.error("❌ GET /u/register:", registerPage.status);
		process.exit(1);
	}

	const registerHtml = await registerPage.text();
	if (!registerHtml.includes("Confirmar contraseña")) {
		console.error("❌ GET /u/register: expected registration form");
		process.exit(1);
	}

	console.log("✅ GET /u/register OK");

	const loginPage = await fetch(`${baseUrl}/u/login`);
	if (loginPage.status !== 200) {
		console.error("❌ GET /u/login:", loginPage.status);
		process.exit(1);
	}

	console.log("✅ GET /u/login OK");

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, email, password }),
	});

	const registerBody = (await register.json()) as {
		user?: { email: string };
		kind?: string;
		error?: { description?: string };
	};
	const registerCookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (register.status !== 201 || registerBody.kind !== "user" || registerBody.user?.email !== email) {
		console.error("❌ POST /api/auth/register/user:", register.status, registerBody);
		process.exit(1);
	}

	if (!registerCookie) {
		console.error("❌ POST /api/auth/register/user must set session cookie");
		process.exit(1);
	}

	console.log("✅ POST /api/auth/register/user → 201, kind user");

	const userHome = await fetch(`${baseUrl}/u/home`, {
		headers: sessionHeader(registerCookie),
		redirect: "manual",
	});

	if (userHome.status === 307 || userHome.status === 308) {
		const location = userHome.headers.get("location") ?? "";
		if (location.includes("/u/login")) {
			console.error("❌ GET /u/home redirected to login with user session");
			process.exit(1);
		}
	}

	if (userHome.status !== 200) {
		console.error("❌ GET /u/home:", userHome.status);
		process.exit(1);
	}

	console.log("✅ GET /u/home 200 with user session");

	const me = await fetch(`${baseUrl}/api/user/me`, { headers: sessionHeader(registerCookie) });
	const meBody = (await me.json()) as { kind?: string; user?: { email: string } };

	if (!me.ok || meBody.kind !== "user" || meBody.user?.email !== email) {
		console.error("❌ GET /api/user/me:", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/user/me OK");

	const duplicate = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Other", email, password }),
	});

	if (duplicate.status !== 409) {
		console.error("❌ duplicate email expected 409, got:", duplicate.status);
		process.exit(1);
	}

	console.log("✅ duplicate email → 409");

	await fetch(`${baseUrl}/api/auth/logout`, {
		method: "POST",
		headers: sessionHeader(registerCookie),
	});

	const unauthHome = await fetch(`${baseUrl}/u/home`, { redirect: "manual" });
	if (unauthHome.status !== 307 && unauthHome.status !== 308) {
		console.error("❌ GET /u/home without session expected redirect, got:", unauthHome.status);
		process.exit(1);
	}

	const unauthLocation = unauthHome.headers.get("location") ?? "";
	if (!unauthLocation.includes("/u/login")) {
		console.error("❌ GET /u/home without session should redirect to /u/login:", unauthLocation);
		process.exit(1);
	}

	console.log("✅ unauthenticated /u/home → /u/login");

	const login = await fetch(`${baseUrl}/api/auth/login/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});

	const loginBody = (await login.json()) as {
		kind?: string;
		user?: { email: string };
		error?: { description?: string };
	};
	const loginCookie = parseSetCookieSession(login.headers.get("set-cookie"));

	if (login.status !== 200 || loginBody.kind !== "user" || !loginCookie) {
		console.error("❌ POST /api/auth/login/user:", login.status, loginBody);
		process.exit(1);
	}

	console.log("✅ POST /api/auth/login/user OK");

	const homeAfterLogin = await fetch(`${baseUrl}/u/home`, {
		headers: sessionHeader(loginCookie),
		redirect: "manual",
	});

	if (homeAfterLogin.status !== 200) {
		console.error("❌ GET /u/home after login:", homeAfterLogin.status);
		process.exit(1);
	}

	console.log("✅ GET /u/home after login OK");

	const authedPublic = await fetch(`${baseUrl}/u`, {
		headers: sessionHeader(loginCookie),
		redirect: "manual",
	});

	if (authedPublic.status !== 307 && authedPublic.status !== 308) {
		console.error("❌ GET /u with user session expected redirect, got:", authedPublic.status);
		process.exit(1);
	}

	const authedPublicLocation = authedPublic.headers.get("location") ?? "";
	if (!authedPublicLocation.includes("/u/home")) {
		console.error("❌ GET /u with user session should redirect to /u/home:", authedPublicLocation);
		process.exit(1);
	}

	console.log("✅ authenticated /u → /u/home");

	const badLogin = await fetch(`${baseUrl}/api/auth/login/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password: "wrong-password" }),
	});

	if (badLogin.status !== 401) {
		console.error("❌ invalid password expected 401, got:", badLogin.status);
		process.exit(1);
	}

	console.log("✅ invalid password → 401");
	console.log("✅ verify:platform-app-public-home passed");
}

void main();
