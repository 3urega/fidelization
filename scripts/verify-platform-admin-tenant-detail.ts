/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { prisma } from "../src/lib/prisma";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";
const PLAN_PRO_ID = "00000000-0000-4000-8000-000000000006";

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
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const session = await platformLogin();
	const cookieHeader = { cookie: `session=${session}` };

	const list = await fetch(`${baseUrl}/api/platform/tenants`, { headers: cookieHeader });
	const listBody = (await list.json()) as {
		tenants?: { id: string; slug: string; name: string }[];
	};

	if (!list.ok || !listBody.tenants?.length) {
		console.error("❌ GET /api/platform/tenants", list.status);
		process.exit(1);
	}

	const target =
		listBody.tenants.find((tenant) => tenant.slug === "cafe-demo") ?? listBody.tenants[0];
	const originalName = target.name;

	const detail = await fetch(`${baseUrl}/api/platform/tenants/${target.id}`, {
		headers: cookieHeader,
	});
	const detailBody = (await detail.json()) as {
		tenant?: { id: string; slug: string; subscriptionPlan?: string };
		owners?: unknown[];
		activity?: { customersCount?: number; staffCount?: number; qrScansCount?: number };
		availablePlans?: { id: string; name: string }[];
	};

	if (
		detail.status !== 200 ||
		detailBody.tenant?.id !== target.id ||
		!Array.isArray(detailBody.owners) ||
		typeof detailBody.activity?.customersCount !== "number" ||
		!detailBody.availablePlans?.some((plan) => plan.name === "pro")
	) {
		console.error("❌ GET /api/platform/tenants/[id]", detail.status, detailBody);
		process.exit(1);
	}

	console.log("✅ GET tenant detail OK");

	const unauth = await fetch(`${baseUrl}/api/platform/tenants/${target.id}`);
	if (unauth.status !== 401) {
		console.error("❌ unauthenticated detail expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated detail → 401");

	const email = `verify-platform-tenant-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Tenant Detail Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation", register.status);
		process.exit(1);
	}

	const userDetail = await fetch(`${baseUrl}/api/platform/tenants/${target.id}`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userDetail.status !== 401) {
		console.error("❌ user session must not access tenant detail, got", userDetail.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on tenant detail");

	const restoredName = `Verify ${randomUUID().slice(0, 8)}`;
	const patchName = await fetch(`${baseUrl}/api/platform/tenants/${target.id}`, {
		method: "PATCH",
		headers: { ...cookieHeader, "Content-Type": "application/json" },
		body: JSON.stringify({ name: restoredName }),
	});

	if (patchName.status !== 200) {
		console.error("❌ PATCH name", patchName.status, await patchName.text());
		process.exit(1);
	}

	console.log("✅ PATCH name OK");

	const duplicateSlugTenant = listBody.tenants.find((tenant) => tenant.id !== target.id);
	if (duplicateSlugTenant) {
		const conflict = await fetch(`${baseUrl}/api/platform/tenants/${target.id}`, {
			method: "PATCH",
			headers: { ...cookieHeader, "Content-Type": "application/json" },
			body: JSON.stringify({ slug: duplicateSlugTenant.slug }),
		});
		const conflictBody = (await conflict.json()) as { error?: { type?: string } };

		if (conflict.status !== 409 || conflictBody.error?.type !== "TenantSlugAlreadyExists") {
			console.error("❌ duplicate slug expected 409 TenantSlugAlreadyExists", conflict.status, conflictBody);
			process.exit(1);
		}

		console.log("✅ duplicate slug → 409");
	}

	const patchPlan = await fetch(`${baseUrl}/api/platform/tenants/${target.id}`, {
		method: "PATCH",
		headers: { ...cookieHeader, "Content-Type": "application/json" },
		body: JSON.stringify({ planId: PLAN_PRO_ID }),
	});
	const patchPlanBody = (await patchPlan.json()) as {
		tenant?: { subscriptionPlan?: string; subscriptionPlanId?: string };
	};

	if (patchPlan.status !== 200 || patchPlanBody.tenant?.subscriptionPlan !== "pro") {
		console.error("❌ PATCH plan", patchPlan.status, patchPlanBody);
		process.exit(1);
	}

	const row = await prisma.tenant.findUnique({ where: { id: target.id } });
	if (row?.subscriptionPlanId !== PLAN_PRO_ID) {
		console.error("❌ Prisma subscriptionPlanId not updated", row?.subscriptionPlanId);
		process.exit(1);
	}

	console.log("✅ PATCH plan persists in Prisma");

	const statusToggle = await fetch(`${baseUrl}/api/platform/tenants/${target.id}/status`, {
		method: "PATCH",
		headers: { ...cookieHeader, "Content-Type": "application/json" },
		body: JSON.stringify({ status: "suspended" }),
	});

	if (statusToggle.status !== 200) {
		console.error("❌ PATCH status regression", statusToggle.status);
		process.exit(1);
	}

	await fetch(`${baseUrl}/api/platform/tenants/${target.id}/status`, {
		method: "PATCH",
		headers: { ...cookieHeader, "Content-Type": "application/json" },
		body: JSON.stringify({ status: "active" }),
	});

	console.log("✅ PATCH status regression OK");

	await fetch(`${baseUrl}/api/platform/tenants/${target.id}`, {
		method: "PATCH",
		headers: { ...cookieHeader, "Content-Type": "application/json" },
		body: JSON.stringify({ name: originalName }),
	});

	const detailPage = await fetch(`${baseUrl}/platform/tenants/${target.id}`, {
		headers: cookieHeader,
	});
	const detailHtml = await detailPage.text();

	if (detailPage.status !== 200 || !detailHtml.includes("Propietarios")) {
		console.error("❌ GET /platform/tenants/[id] page", detailPage.status);
		process.exit(1);
	}

	console.log("✅ GET tenant detail page OK");
	console.log("✅ verify:platform-admin-tenant-detail passed");
}

void main();
