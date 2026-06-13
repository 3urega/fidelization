/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";
const DEMO_TEMPLATE_COFFEE_ID = "00000000-0000-4000-8000-000000000020";

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

async function main(): Promise<void> {
	const platformSession = await platformLogin();
	const platformCookie = { cookie: `session=${platformSession}` };

	const list = await fetch(`${baseUrl}/api/platform/campaign-templates`, { headers: platformCookie });
	const listBody = (await list.json()) as {
		templates?: {
			id?: string;
			name?: string;
			requiredStamps?: number;
			isActive?: boolean;
		}[];
	};

	if (list.status !== 200 || !Array.isArray(listBody.templates)) {
		console.error("❌ GET /api/platform/campaign-templates", list.status, listBody);
		process.exit(1);
	}

	if (listBody.templates.length < 3) {
		console.error("❌ expected at least 3 seeded templates", listBody.templates.length);
		process.exit(1);
	}

	const coffeeTemplate = listBody.templates.find((row) => row.id === DEMO_TEMPLATE_COFFEE_ID);
	if (!coffeeTemplate?.name?.includes("cafés") || coffeeTemplate.requiredStamps !== 10) {
		console.error("❌ seeded coffee template missing or wrong", coffeeTemplate);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/campaign-templates → seeded library");

	const templateName = `Verify template ${randomUUID().slice(0, 8)}`;
	const create = await fetch(`${baseUrl}/api/platform/campaign-templates`, {
		method: "POST",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({
			name: templateName,
			description: "Plantilla creada por verify E2E",
			requiredStamps: 6,
			suggestedStampTypeLabel: "Té",
			visualTemplate: "generic",
			cardBackgroundVariant: "coffee-minimal",
		}),
	});
	const createBody = (await create.json()) as {
		template?: { id?: string; name?: string; isActive?: boolean };
	};

	if (
		create.status !== 201 ||
		!createBody.template?.id ||
		createBody.template.name !== templateName ||
		createBody.template.isActive !== true
	) {
		console.error("❌ POST /api/platform/campaign-templates", create.status, createBody);
		process.exit(1);
	}

	console.log("✅ POST creates active template");

	const createdId = createBody.template.id;
	const deactivate = await fetch(`${baseUrl}/api/platform/campaign-templates/${createdId}`, {
		method: "PATCH",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({ isActive: false }),
	});
	const deactivateBody = (await deactivate.json()) as {
		template?: { isActive?: boolean };
	};

	if (deactivate.status !== 200 || deactivateBody.template?.isActive !== false) {
		console.error("❌ PATCH deactivate template", deactivate.status, deactivateBody);
		process.exit(1);
	}

	console.log("✅ PATCH deactivates template");

	const invalidCreate = await fetch(`${baseUrl}/api/platform/campaign-templates`, {
		method: "POST",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({ name: "", requiredStamps: 0 }),
	});

	if (invalidCreate.status !== 400) {
		console.error("❌ invalid create expected 400, got", invalidCreate.status);
		process.exit(1);
	}

	console.log("✅ invalid POST → 400");

	const unauth = await fetch(`${baseUrl}/api/platform/campaign-templates`);
	if (unauth.status !== 401) {
		console.error("❌ unauthenticated expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated → 401");

	const email = `verify-templates-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Templates Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation", register.status);
		process.exit(1);
	}

	const userList = await fetch(`${baseUrl}/api/platform/campaign-templates`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userList.status !== 401) {
		console.error("❌ user session must not list platform templates, got", userList.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on campaign-templates");

	const page = await fetch(`${baseUrl}/platform/campaign-templates`, { headers: platformCookie });

	if (page.status !== 200) {
		console.error("❌ GET /platform/campaign-templates page expected 200, got", page.status);
		process.exit(1);
	}

	const pageHtml = await page.text();
	if (
		!pageHtml.includes("Plantillas") ||
		!pageHtml.includes("Tipo sugerido") ||
		!pageHtml.includes("Nueva plantilla")
	) {
		console.error("❌ campaign-templates page missing expected copy");
		process.exit(1);
	}

	console.log("✅ GET /platform/campaign-templates page OK");
	console.log("✅ verify:platform-admin-campaign-templates passed");
}

void main();
