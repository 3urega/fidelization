/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

process.env.DISABLE_TENANT_PLAN_GATES = "0";

import { randomUUID } from "crypto";

import { RULETA_GAME_SLUG } from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";
import { DEMO_TENANT_ID } from "../src/lib/tenant/mockTenantBySlug";
import { prisma } from "../src/lib/prisma";
import {
	apexBaseUrl,
	ensureDemoTenantActive,
	parseSetCookieSession,
	tenantFetch,
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";
import {
	findRouletteAuthGrantedOutcome,
} from "./lib/staff-scan-verify-helpers";
import {
	brandingVerifyBaseUrl,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";
import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";

const PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";
const activitySegmentId = "00000000-0000-4000-8000-000000000f01";

const activityVerifyConfig = {
	...DEMO_ROULETTE_CONFIG,
	rules: {
		...DEMO_ROULETTE_CONFIG.rules,
		maxSpinsInPeriod: 5,
		maxSpinsPerDay: 5,
	},
	segments: [
		{
			id: activitySegmentId,
			label: "Llavero actividad",
			weight: 100,
			prizeType: "points",
			prize: { points: 10 },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000f02",
			label: "Sin premio",
			weight: 1,
			prizeType: "none",
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
};

type SummaryResponse = {
	totalSpins?: number;
	prizes?: { segmentId: string; label: string; spinCount: number }[];
	date?: string;
};

type SpinsResponse = {
	spins?: { customerId: string; customerName: string; spinId: string }[];
};

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

function sessionHeaders(cookie: string): Record<string, string> {
	return { cookie: `session=${cookie}` };
}

async function registerUser(): Promise<{ cookie: string; qrValue: string }> {
	const email = `verify-activity-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Activity Verify User", email, password }),
	});
	const cookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (register.status !== 201 || !cookie) {
		console.error("❌ register user", register.status);
		process.exit(1);
	}

	const me = await fetch(`${apexBaseUrl}/api/user/me`, { headers: sessionHeaders(cookie) });
	const meBody = (await me.json()) as { user?: { qrValue?: string | null } };

	if (!me.ok || !meBody.user?.qrValue) {
		console.error("❌ user me qrValue", me.status);
		process.exit(1);
	}

	return { cookie, qrValue: meBody.user.qrValue };
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: PLAN_PREMIUM_ID },
	});

	await prisma.tenantGameActivation.upsert({
		where: {
			tenantId_gameSlug: { tenantId: DEMO_TENANT_ID, gameSlug: RULETA_GAME_SLUG },
		},
		create: {
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: activityVerifyConfig,
		},
		update: {
			isEnabled: true,
			config: activityVerifyConfig,
		},
	});

	const unauthenticated = await fetch(
		`${apexBaseUrl}/api/loyalty/games/ruleta/activity/summary`,
		{ headers: tenantHeaders() },
	);

	if (unauthenticated.status !== 401) {
		console.error("❌ summary without session:", unauthenticated.status);
		process.exit(1);
	}

	console.log("✅ GET summary without session → 401");

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders({
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	});

	const ruletaPage = await fetch(`${brandingVerifyBaseUrl}/settings/games/ruleta`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const ruletaHtml = await ruletaPage.text();

	if (
		ruletaPage.status !== 200 ||
		!ruletaHtml.includes("Actividad") ||
		!ruletaHtml.includes("Configuración")
	) {
		console.error("❌ GET /settings/games/ruleta page smoke:", ruletaPage.status);
		process.exit(1);
	}

	console.log("✅ GET /settings/games/ruleta page includes Actividad tab");

	const { cookie: userCookie, qrValue } = await registerUser();

	await fetch(`${apexBaseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});

	await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/enroll`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});

	const scan = await tenantFetch("/api/loyalty/scan", {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			qrValue,
			targetType: "roulette_authorize",
			purchaseAmountEuros: 15,
		}),
	});
	const scanBody = (await scan.json()) as { outcomes?: unknown[] };

	if (scan.status !== 200 || !findRouletteAuthGrantedOutcome(scanBody.outcomes)) {
		console.error("❌ staff authorize for activity seed", scan.status, scanBody);
		process.exit(1);
	}

	const spin = await fetch(`${apexBaseUrl}/api/user/establishments/${tenantSlug}/games/ruleta/spin`, {
		method: "POST",
		headers: sessionHeaders(userCookie),
	});
	const spinBody = (await spin.json()) as { segmentId?: string; spinId?: string };

	if (!spin.ok || !spinBody.spinId) {
		console.error("❌ client spin for activity seed", spin.status, spinBody);
		process.exit(1);
	}

	const dbSpin = await prisma.rouletteSpin.findUnique({
		where: { id: spinBody.spinId },
		select: { segmentId: true, prizeType: true },
	});

	if (!dbSpin || dbSpin.prizeType === "none") {
		console.error("❌ expected non-none spin in DB", dbSpin);
		process.exit(1);
	}

	const segmentIdForDrillDown = dbSpin.segmentId;

	console.log("✅ seeded roulette spin via enroll → authorize → spin");

	const summaryResponse = await fetch(
		`${apexBaseUrl}/api/loyalty/games/ruleta/activity/summary`,
		{ headers: { cookie: ownerHeaders.cookie ?? "" } },
	);
	const summary = (await summaryResponse.json()) as SummaryResponse;

	if (!summaryResponse.ok || (summary.totalSpins ?? 0) < 1) {
		console.error("❌ owner GET summary", summaryResponse.status, summary);
		process.exit(1);
	}

	const prizeRow = summary.prizes?.find((row) => row.segmentId === segmentIdForDrillDown);

	if (!prizeRow || prizeRow.spinCount < 1) {
		console.error("❌ summary missing prize row", summary.prizes, segmentIdForDrillDown);
		process.exit(1);
	}

	console.log("✅ owner GET summary includes spin and prize breakdown");

	const spinsResponse = await fetch(
		`${apexBaseUrl}/api/loyalty/games/ruleta/activity/spins?segmentId=${encodeURIComponent(segmentIdForDrillDown)}&date=${encodeURIComponent(summary.date ?? "")}`,
		{ headers: { cookie: ownerHeaders.cookie ?? "" } },
	);
	const spins = (await spinsResponse.json()) as SpinsResponse;

	if (!spinsResponse.ok || (spins.spins?.length ?? 0) < 1) {
		console.error("❌ owner GET spins drill-down", spinsResponse.status, spins);
		process.exit(1);
	}

	console.log("✅ owner GET spins drill-down lists winner");

	const employeeEmail = `roulette.activity.employee.${randomUUID().slice(0, 8)}@example.com`;
	const employeePassword = "temp-pass-verify-115";

	const invite = await fetch(`${apexBaseUrl}/api/tenant/employees`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: "Activity Verify Employee",
			email: employeeEmail,
			password: employeePassword,
		}),
	});

	if (invite.status !== 201) {
		console.error("❌ invite employee", invite.status);
		process.exit(1);
	}

	const employeeLogin = await tenantFetch("/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: employeeEmail, password: employeePassword }),
	});
	const employeeCookie = parseSetCookieSession(employeeLogin.headers.get("set-cookie"));

	if (employeeLogin.status !== 200 || !employeeCookie) {
		console.error("❌ employee login", employeeLogin.status);
		process.exit(1);
	}

	const employeeSummary = await fetch(
		`${apexBaseUrl}/api/loyalty/games/ruleta/activity/summary`,
		{ headers: tenantHeaders({ cookie: `session=${employeeCookie}` }) },
	);
	const employeeBody = (await employeeSummary.json()) as { error?: { type?: string } };

	if (employeeSummary.status !== 403 || employeeBody.error?.type !== "RouletteConfigForbidden") {
		console.error("❌ employee GET summary", employeeSummary.status, employeeBody);
		process.exit(1);
	}

	console.log("✅ employee GET summary → 403 RouletteConfigForbidden");
	console.log("✅ verify:roulette-activity-dashboard passed");
}

void main();
