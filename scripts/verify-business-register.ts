/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { verifyPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/prisma";

/**
 * E2E check: business registration step 1 (onboarding session, user only, no tenant membership).
 * Requires dev server at NEXT_PUBLIC_API_URL (default http://localhost:3000) and DATABASE_URL.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSetCookieSession(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function main(): Promise<void> {
	const page = await fetch(`${baseUrl}/register/business`, { redirect: "manual" });

	if (page.status !== 200) {
		console.error("❌ GET /register/business:", page.status);
		process.exit(1);
	}

	const html = await page.text();
	if (!html.includes("Confirmar contraseña") && !html.includes("confirm")) {
		console.error("❌ GET /register/business: expected registration form in HTML");
		process.exit(1);
	}

	console.log("✅ GET /register/business OK");

	const redirectRegister = await fetch(`${baseUrl}/register`, { redirect: "manual" });
	if (redirectRegister.status !== 307 && redirectRegister.status !== 308) {
		console.error("❌ GET /register expected redirect, got:", redirectRegister.status);
		process.exit(1);
	}

	const location = redirectRegister.headers.get("location") ?? "";
	if (!location.includes("/register/business")) {
		console.error("❌ GET /register redirect location:", location);
		process.exit(1);
	}

	console.log("✅ GET /register redirects to /register/business");

	const email = `verify-business-${randomUUID()}@example.local`;
	const password = "verify-pass-123";

	const mismatch = await fetch(`${baseUrl}/api/auth/register/business`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Verify Business",
			email,
			password,
			confirmPassword: "different-password",
		}),
	});

	if (mismatch.status !== 400) {
		console.error("❌ POST mismatch passwords expected 400, got:", mismatch.status);
		process.exit(1);
	}

	console.log("✅ POST password mismatch → 400");

	const register = await fetch(`${baseUrl}/api/auth/register/business`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Verify Business",
			email,
			password,
			confirmPassword: password,
		}),
	});

	const registerBody = (await register.json()) as {
		user?: { id: string; email: string };
		intendedRole?: string;
		error?: { description?: string };
	};
	const setCookie = register.headers.get("set-cookie");
	const sessionCookie = parseSetCookieSession(setCookie);

	if (
		register.status !== 201 ||
		registerBody.user?.email !== email ||
		registerBody.intendedRole !== "owner"
	) {
		console.error("❌ POST register business:", register.status, registerBody);
		process.exit(1);
	}

	if (!sessionCookie) {
		console.error("❌ POST register business must set onboarding session cookie");
		process.exit(1);
	}

	console.log("✅ POST /api/auth/register/business → 201, onboarding session cookie");

	const homeBlocked = await fetch(`${baseUrl}/home`, {
		headers: { cookie: `session=${sessionCookie}` },
		redirect: "manual",
	});
	const homeLocation = homeBlocked.headers.get("location") ?? "";
	if (
		(homeBlocked.status !== 307 && homeBlocked.status !== 308) ||
		!homeLocation.includes("/register/business/tenant")
	) {
		console.error("❌ Onboarding session must redirect /home to wizard step 2");
		process.exit(1);
	}

	console.log("✅ Onboarding session cannot access /home yet");

	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for DB assertions");
		process.exit(1);
	}

	const userRow = await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			passwordHash: true,
			memberships: { select: { id: true } },
		},
	});

	if (!userRow || userRow.id !== registerBody.user.id) {
		console.error("❌ User not persisted in DB:", userRow?.id, registerBody.user.id);
		process.exit(1);
	}

	if (userRow.passwordHash === password || !userRow.passwordHash.startsWith("$2")) {
		console.error("❌ password_hash must be bcrypt hash, not plaintext");
		process.exit(1);
	}

	const passwordValid = await verifyPassword(password, userRow.passwordHash);
	if (!passwordValid) {
		console.error("❌ verifyPassword failed for stored hash");
		process.exit(1);
	}

	if (userRow.memberships.length !== 0) {
		console.error(
			"❌ Expected no tenant_memberships after step 1, got:",
			userRow.memberships.length,
		);
		process.exit(1);
	}

	console.log("✅ DB: user persisted, password hashed, no memberships");

	const duplicate = await fetch(`${baseUrl}/api/auth/register/business`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Verify Business",
			email,
			password,
			confirmPassword: password,
		}),
	});

	if (duplicate.status !== 409) {
		console.error("❌ Duplicate email expected 409, got:", duplicate.status);
		process.exit(1);
	}

	console.log("✅ Duplicate email → 409");

	await prisma.user.delete({ where: { email } }).catch(() => undefined);

	console.log("✅ verify:business-register passed");
}

void main();
