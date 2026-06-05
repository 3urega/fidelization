/* eslint-disable no-console -- shared verify helpers */
import { DEMO_TENANT_ID } from "../../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../../src/lib/prisma";

export const brandingVerifyBaseUrl = (
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export async function ensureDemoTenantActive(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		return;
	}

	await prisma.tenant.updateMany({
		where: { id: DEMO_TENANT_ID },
		data: { status: "active" },
	});
}

export function parseSetCookieSession(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

export async function loginOwnerForBrandingVerify(): Promise<string> {
	const email = process.env.OWNER_VERIFY_EMAIL?.trim();
	const password = process.env.OWNER_VERIFY_PASSWORD;

	if (email && password) {
		const response = await fetch(`${brandingVerifyBaseUrl}/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		const body = (await response.json()) as { error?: { description?: string } };
		const cookie = parseSetCookieSession(response.headers.get("set-cookie"));

		if (!response.ok || !cookie) {
			console.error("❌ POST /api/auth/login:", response.status, body);
			process.exit(1);
		}

		return cookie;
	}

	const response = await fetch(`${brandingVerifyBaseUrl}/api/auth/demo`, { method: "POST" });
	const body = (await response.json()) as { error?: { description?: string } };
	const cookie = parseSetCookieSession(response.headers.get("set-cookie"));

	if (!response.ok || !cookie) {
		console.error("❌ POST /api/auth/demo:", response.status, body);
		process.exit(1);
	}

	return cookie;
}
