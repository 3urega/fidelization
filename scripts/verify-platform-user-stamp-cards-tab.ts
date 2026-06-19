/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { buildUserStampCardsSummary } from "../src/lib/platform/userStampCardsSummary";
import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
import {
	ensureDemoTenantActive,
	parseSetCookieSession,
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";
import {
	campaignScanBody,
	findStampAddedOutcome,
	postStaffScan,
	resolveStampCampaignTargetId,
} from "./lib/staff-scan-verify-helpers";

/**
 * Domain + E2E: profile tab Mis tarjetas (Phase S4 #96).
 * Requires dev server + DATABASE_URL for E2E.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

function sessionHeaders(session: string): { cookie: string } {
	return { cookie: `session=${session}` };
}

function runUnitTests(): void {
	const summary = buildUserStampCardsSummary([
		{
			name: "Cafe Alpha",
			slug: "cafe-alpha",
			logoUrl: null,
			stampProgress: [
				{
					campaignId: "c1",
					campaignName: "Alpha Loyalty",
					current: 3,
					required: 10,
					completed: false,
				},
				{
					campaignId: "c2",
					campaignName: "Alpha Done",
					current: 10,
					required: 10,
					completed: true,
				},
				{
					campaignId: "c3",
					campaignName: "Alpha Fresh",
					current: 0,
					required: 5,
					completed: false,
				},
			],
		},
		{
			name: "Cafe Beta",
			slug: "cafe-beta",
			logoUrl: null,
			stampProgress: [
				{
					campaignId: "c4",
					campaignName: "Beta Loyalty",
					current: 1,
					required: 8,
					completed: false,
				},
			],
		},
	]);

	if (summary.inProgress.length !== 2) {
		console.error("❌ expected 2 in-progress cards (excludes 0/N)", summary.inProgress);
		process.exit(1);
	}

	if (summary.completed.length !== 1 || summary.completed[0]?.campaign.campaignId !== "c2") {
		console.error("❌ expected 1 completed card", summary.completed);
		process.exit(1);
	}

	const excluded = summary.inProgress.some((item) => item.campaign.campaignId === "c3");
	if (excluded) {
		console.error("❌ 0/N campaign should be excluded from in progress");
		process.exit(1);
	}

	console.log("✅ buildUserStampCardsSummary groups in-progress vs completed");
}

async function runE2eTests(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required for E2E");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const email = `verify-stamp-cards-tab-${randomUUID()}@example.local`;
	const password = "password123";

	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Stamp Cards Tab User", email, password }),
	});
	const registerBody = (await register.json()) as {
		user?: { qrValue: string | null };
		kind?: string;
	};
	const userCookie = parseSetCookieSession(register.headers.get("set-cookie"));

	if (register.status !== 201 || registerBody.kind !== "user" || !userCookie || !registerBody.user?.qrValue) {
		console.error("❌ register user failed", register.status, registerBody);
		process.exit(1);
	}

	console.log("✅ user session ready");

	const join = await fetch(`${baseUrl}/api/user/establishments/join`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...sessionHeaders(userCookie) },
		body: JSON.stringify({ slug: tenantSlug }),
	});

	if (join.status !== 201) {
		console.error("❌ join demo tenant failed", join.status, await join.text());
		process.exit(1);
	}

	console.log("✅ joined demo tenant");

	const ownerLogin = await fetch(`${baseUrl}/api/auth/demo`, { method: "POST" });
	const ownerCookie = parseSetCookieSession(ownerLogin.headers.get("set-cookie"));
	if (!ownerLogin.ok || !ownerCookie) {
		console.error("❌ owner demo login failed");
		process.exit(1);
	}

	const ownerHeaders = tenantHeaders({
		"Content-Type": "application/json",
		cookie: `session=${ownerCookie}`,
	});

	const campaignId = await resolveStampCampaignTargetId(
		baseUrl,
		ownerHeaders,
		"Stamp cards tab verify",
	);

	const scan = await postStaffScan(
		baseUrl,
		ownerHeaders,
		campaignScanBody(registerBody.user.qrValue, campaignId),
	);
	const stampOutcome = findStampAddedOutcome(scan.body.outcomes, campaignId);

	if (scan.status !== 200 || !stampOutcome || (stampOutcome.current ?? 0) < 1) {
		console.error("❌ staff scan for stamp progress failed", scan.status, scan.body);
		process.exit(1);
	}

	console.log("✅ staff scan created stamp progress");

	const relationships = await fetch(`${baseUrl}/api/user/me/relationships`, {
		headers: sessionHeaders(userCookie),
	});
	const relationshipsBody = (await relationships.json()) as {
		establishments?: {
			name: string;
			slug: string;
			logoUrl: string | null;
			stampProgress: {
				campaignId: string;
				campaignName: string;
				current: number;
				required: number;
				completed: boolean;
			}[];
		}[];
	};

	if (!relationships.ok || !relationshipsBody.establishments?.length) {
		console.error("❌ GET relationships failed", relationships.status, relationshipsBody);
		process.exit(1);
	}

	const summary = buildUserStampCardsSummary(relationshipsBody.establishments);

	if (summary.inProgress.length < 1) {
		console.error("❌ expected at least one in-progress stamp card", summary);
		process.exit(1);
	}

	console.log("✅ relationships aggregate to in-progress stamp cards");

	const profile = await fetch(`${baseUrl}/home/profile?tab=tarjetas`, {
		headers: sessionHeaders(userCookie),
	});
	const profileHtml = await profile.text();

	if (profile.status !== 200 || !profileHtml.includes("Mis tarjetas") || !profileHtml.includes("Tu perfil")) {
		console.error("❌ profile tarjetas tab shell missing copy", profile.status);
		process.exit(1);
	}

	console.log("✅ GET /home/profile?tab=tarjetas shell OK");

	const unauthenticated = await fetch(`${baseUrl}/home/profile?tab=tarjetas`, { redirect: "manual" });

	if (unauthenticated.status !== 307 && unauthenticated.status !== 308) {
		console.error("❌ unauthenticated profile should redirect", unauthenticated.status);
		process.exit(1);
	}

	const location = unauthenticated.headers.get("location") ?? "";
	if (!location.includes("/login")) {
		console.error("❌ expected redirect to login", location);
		process.exit(1);
	}

	console.log("✅ unauthenticated redirect to login");
}

async function main(): Promise<void> {
	runUnitTests();
	await runE2eTests();
	console.log("✅ verify:platform-user-stamp-cards-tab passed");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
