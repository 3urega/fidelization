/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function platformLogin(): Promise<string> {
	const response = await fetch(`${baseUrl}/api/platform/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: superadminEmail, password: superadminPassword }),
	});

	const session = parseSessionCookie(response.headers.get("set-cookie"));

	if (!response.ok || !session) {
		console.error("❌ platform login failed", response.status);
		process.exit(1);
	}

	return session;
}

function assertNoSecrets(payload: unknown): void {
	const serialized = JSON.stringify(payload);

	if (
		serialized.includes("sk_") ||
		serialized.includes("whsec_") ||
		serialized.match(/AUTH_SECRET[^"]*"[^"]{8,}/)
	) {
		console.error("❌ response must not contain secret values");
		process.exit(1);
	}
}

async function main(): Promise<void> {
	const noSession = await fetch(`${baseUrl}/api/platform/settings`);

	if (noSession.status !== 401) {
		console.error("❌ GET settings without session should be 401", noSession.status);
		process.exit(1);
	}

	console.log("✅ GET settings without platform session → 401");

	const platformSession = await platformLogin();
	const platformCookie = { cookie: `session=${platformSession}` };

	const getBefore = await fetch(`${baseUrl}/api/platform/settings`, {
		headers: platformCookie,
	});
	const getBeforeBody = (await getBefore.json()) as {
		branding?: { displayName?: string; logoUrl?: string };
		integrations?: { groups?: Array<{ key: string; configured: boolean }> };
	};

	if (getBefore.status !== 200 || !getBeforeBody.branding?.displayName) {
		console.error("❌ GET settings", getBefore.status, getBeforeBody);
		process.exit(1);
	}

	assertNoSecrets(getBeforeBody);

	const groupKeys = getBeforeBody.integrations?.groups?.map((group) => group.key) ?? [];

	if (!groupKeys.includes("auth") || !groupKeys.includes("stripe") || !groupKeys.includes("smtp")) {
		console.error("❌ integration groups missing", groupKeys);
		process.exit(1);
	}

	console.log("✅ GET platform settings with integrations checklist");

	const patch = await fetch(`${baseUrl}/api/platform/settings`, {
		method: "PATCH",
		headers: {
			...platformCookie,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			displayName: "Fideli Platform E2E",
			logoUrl: "https://example.com/platform-logo.png",
		}),
	});
	const patchBody = (await patch.json()) as {
		branding?: { displayName?: string; logoUrl?: string };
	};

	if (
		patch.status !== 200 ||
		patchBody.branding?.displayName !== "Fideli Platform E2E" ||
		patchBody.branding?.logoUrl !== "https://example.com/platform-logo.png"
	) {
		console.error("❌ PATCH settings", patch.status, patchBody);
		process.exit(1);
	}

	console.log("✅ PATCH platform branding");

	const getAfter = await fetch(`${baseUrl}/api/platform/settings`, {
		headers: platformCookie,
	});
	const getAfterBody = (await getAfter.json()) as {
		branding?: { displayName?: string; logoUrl?: string };
	};

	if (
		getAfter.status !== 200 ||
		getAfterBody.branding?.displayName !== "Fideli Platform E2E" ||
		getAfterBody.branding?.logoUrl !== "https://example.com/platform-logo.png"
	) {
		console.error("❌ GET settings after PATCH", getAfter.status, getAfterBody);
		process.exit(1);
	}

	console.log("✅ GET settings reflects persisted branding");

	const settingsPage = await fetch(`${baseUrl}/platform/settings`, {
		headers: platformCookie,
	});

	if (settingsPage.status !== 200) {
		console.error("❌ GET /platform/settings page", settingsPage.status);
		process.exit(1);
	}

	const html = await settingsPage.text();

	if (!html.includes("Sistema") && !html.includes("Branding plataforma")) {
		console.error("❌ settings page HTML missing expected content");
		process.exit(1);
	}

	console.log("✅ GET /platform/settings page smoke");

	const invalidPatch = await fetch(`${baseUrl}/api/platform/settings`, {
		method: "PATCH",
		headers: {
			...platformCookie,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ displayName: "   " }),
	});

	if (invalidPatch.status !== 400) {
		console.error("❌ PATCH invalid displayName should be 400", invalidPatch.status);
		process.exit(1);
	}

	console.log("✅ PATCH invalid branding → 400");

	console.log("\n✅ verify:platform-admin-settings passed");
}

void main();
