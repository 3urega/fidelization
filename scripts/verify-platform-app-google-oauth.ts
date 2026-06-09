/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { isGoogleOAuthConfigured } from "../src/lib/platform/googleOAuth";

/**
 * E2E issue #45 VS2: Google OAuth UI markers + API route (dev server).
 * Full Google token flow requires real GIS credentials; domain logic in verify:platform-app-google-oauth-use-case.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function assertGoogleOAuthMarker(path: string): Promise<void> {
	const response = await fetch(`${baseUrl}${path}`);
	const html = await response.text();

	if (response.status !== 200) {
		console.error(`❌ GET ${path}:`, response.status);
		process.exit(1);
	}

	if (!html.includes('data-platform-google-oauth-enabled=""')) {
		console.error(`❌ GET ${path}: expected Google OAuth enabled marker`);
		process.exit(1);
	}
}

async function main(): Promise<void> {
	const googleConfigured = isGoogleOAuthConfigured();

	if (!googleConfigured) {
		console.log(
			"⏭️ skip UI marker checks — set GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_CLIENT_ID",
		);
	} else {
		await assertGoogleOAuthMarker("/u");
		console.log("✅ GET /u — Google OAuth marker");

		await assertGoogleOAuthMarker("/u/register");
		console.log("✅ GET /u/register — Google OAuth marker");

		await assertGoogleOAuthMarker("/u/login");
		console.log("✅ GET /u/login — Google OAuth marker");
	}

	const missingToken = await fetch(`${baseUrl}/api/auth/oauth/google`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({}),
	});

	if (missingToken.status !== 400) {
		console.error("❌ POST /api/auth/oauth/google without idToken:", missingToken.status);
		process.exit(1);
	}

	console.log("✅ POST /api/auth/oauth/google → 400 without idToken");

	if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
		const notConfigured = await fetch(`${baseUrl}/api/auth/oauth/google`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ idToken: "invalid-token" }),
		});

		if (notConfigured.status !== 503) {
			console.error("❌ expected 503 when GOOGLE_CLIENT_ID unset:", notConfigured.status);
			process.exit(1);
		}

		console.log("✅ POST /api/auth/oauth/google → 503 when not configured");
		console.log("✅ verify:platform-app-google-oauth passed (API guards only)");
		return;
	}

	const invalidToken = await fetch(`${baseUrl}/api/auth/oauth/google`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken: "invalid-token" }),
	});
	const invalidBody = (await invalidToken.json()) as { error?: { type?: string } };

	if (invalidToken.status !== 401 || invalidBody.error?.type !== "InvalidGoogleToken") {
		console.error("❌ invalid idToken expected 401 InvalidGoogleToken:", invalidToken.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ POST /api/auth/oauth/google → 401 InvalidGoogleToken");

	const optionalE2eToken = process.env.GOOGLE_OAUTH_E2E_ID_TOKEN?.trim();
	if (!optionalE2eToken) {
		console.log(
			"⏭️ skip live Google login — set GOOGLE_OAUTH_E2E_ID_TOKEN for full OAuth E2E",
		);
		console.log("✅ verify:platform-app-google-oauth passed");
		return;
	}

	const googleLogin = await fetch(`${baseUrl}/api/auth/oauth/google`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken: optionalE2eToken }),
	});
	const loginBody = (await googleLogin.json()) as {
		user?: { id: string; email: string };
		kind?: string;
	};
	const cookie = parseSessionCookie(googleLogin.headers.get("set-cookie"));

	if (googleLogin.status !== 200 || loginBody.kind !== "user" || !cookie || !loginBody.user?.id) {
		console.error("❌ live Google OAuth login failed:", googleLogin.status, loginBody);
		process.exit(1);
	}

	console.log("✅ live Google OAuth login → kind:user session");

	const me = await fetch(`${baseUrl}/api/user/me`, {
		headers: { cookie: `session=${cookie}` },
	});
	const meBody = (await me.json()) as { user?: { id: string } };

	if (!me.ok || meBody.user?.id !== loginBody.user.id) {
		console.error("❌ GET /api/user/me after Google OAuth:", me.status, meBody);
		process.exit(1);
	}

	console.log("✅ GET /api/user/me after Google OAuth");

	if (loginBody.user.email && process.env.DATABASE_URL) {
		const { prisma } = await import("../src/lib/prisma");
		await prisma.user.deleteMany({ where: { email: loginBody.user.email } });
	}

	console.log("✅ verify:platform-app-google-oauth passed");
}

void main();
