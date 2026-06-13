/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import {
	TENANT_ID_HEADER,
	TENANT_SLUG_HEADER,
} from "../src/lib/tenant/forwardResolvedTenantHeaders";
import { prisma } from "../src/lib/prisma";
import {
	apexBaseUrl,
	ensureDemoTenantActive,
	parseSetCookieSession,
	tenantId,
	tenantSlug,
} from "./lib/customer-verify-helpers";
import {
	brandingVerifyBaseUrl,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

const PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const PLAN_PRO_ID = "00000000-0000-4000-8000-000000000006";

function tenantHeaders(extra: Record<string, string> = {}): Record<string, string> {
	return {
		[TENANT_ID_HEADER]: tenantId,
		[TENANT_SLUG_HEADER]: tenantSlug,
		...extra,
	};
}

type ScanOutcome = { kind: string; current?: number; required?: number; campaignName?: string };

type ScanResponse = {
	customer?: { id: string; pointsBalance: number };
	outcomes?: ScanOutcome[];
	error?: { type?: string; description?: string };
};

function hasOutcome(outcomes: ScanOutcome[] | undefined, kind: string): boolean {
	return outcomes?.some((outcome) => outcome.kind === kind) ?? false;
}

async function postScan(
	headers: Record<string, string>,
	body: Record<string, unknown>,
): Promise<{ status: number; body: ScanResponse }> {
	const response = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});

	return { status: response.status, body: (await response.json()) as ScanResponse };
}

/**
 * E2E: POST /api/loyalty/scan with targetType/targetId → outcomes[].
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	await ensureDemoTenantActive();

	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = tenantHeaders({
		cookie: `session=${ownerCookie}`,
		"Content-Type": "application/json",
	});

	const me = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: ownerHeaders.cookie ?? "" },
	});
	const meBody = (await me.json()) as {
		tenant?: { id: string; subscriptionPlanId: string | null };
		role?: string;
	};

	if (!me.ok || meBody.role !== "owner" || !meBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", me.status, meBody);
		process.exit(1);
	}

	const demoTenantId = meBody.tenant.id;
	const restorePlanId = meBody.tenant.subscriptionPlanId ?? PLAN_BASIC_ID;
	console.log("✅ GET /api/me (owner)");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: PLAN_PRO_ID }),
	});
	console.log("✅ PATCH tenant-plan → pro");

	const suffix = Date.now();
	const createType = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ label: `Record target type ${suffix}` }),
	});
	const createTypeBody = (await createType.json()) as { stampType?: { id: string } };
	if (!createType.ok || !createTypeBody.stampType?.id) {
		console.error("❌ POST stamp-type:", createType.status, createTypeBody);
		process.exit(1);
	}

	const stampTypeId = createTypeBody.stampType.id;
	const campaignAName = `Record A ${suffix}`;
	const campaignBName = `Record B ${suffix}`;
	const campaignCompleteName = `Record complete ${suffix}`;

	async function createCampaign(name: string, requiredStamps: number): Promise<string> {
		const response = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns`, {
			method: "POST",
			headers: ownerHeaders,
			body: JSON.stringify({ name, requiredStamps, stampTypeId, visualTemplate: "coffee" }),
		});
		const body = (await response.json()) as { campaign?: { id: string } };
		if (!response.ok || !body.campaign?.id) {
			console.error("❌ POST stamp-campaign:", response.status, body);
			process.exit(1);
		}

		return body.campaign.id;
	}

	const campaignAId = await createCampaign(campaignAName, 10);
	const campaignBId = await createCampaign(campaignBName, 5);
	const campaignCompleteId = await createCampaign(campaignCompleteName, 2);
	console.log("✅ POST stamp-campaigns");

	const createPromo = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			title: `Record promo ${suffix}`,
			description: "Límite 2 usos",
			type: "discount",
			maxUsesPerUser: 2,
		}),
	});
	const createPromoBody = (await createPromo.json()) as { promotion?: { id: string } };
	if (!createPromo.ok || !createPromoBody.promotion?.id) {
		console.error("❌ POST promotion:", createPromo.status, createPromoBody);
		process.exit(1);
	}

	const promoId = createPromoBody.promotion.id;
	console.log("✅ POST promotion");

	const customerRegister = await fetch(`${apexBaseUrl}/api/loyalty/customers/register`, {
		method: "POST",
		headers: tenantHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify({ name: `Record Target Customer ${suffix}` }),
	});
	const customerRegisterBody = (await customerRegister.json()) as {
		customer?: { id: string; qrValue: string };
	};
	if (
		customerRegister.status !== 201 ||
		!customerRegisterBody.customer?.id ||
		!customerRegisterBody.customer.qrValue
	) {
		console.error("❌ customer register:", customerRegister.status, customerRegisterBody);
		process.exit(1);
	}

	const customerId = customerRegisterBody.customer.id;
	const qrValue = customerRegisterBody.customer.qrValue;
	console.log("✅ setup customer");

	const legacyReject = await postScan(ownerHeaders, {
		qrValue,
		stampTypeId,
		targetType: "stamp_campaign",
		targetId: campaignAId,
	});
	if (legacyReject.status !== 400 || legacyReject.body.error?.type !== "InvalidStampScan") {
		console.error("❌ stampTypeId in body should be 400:", legacyReject.status, legacyReject.body);
		process.exit(1);
	}

	console.log("✅ stampTypeId in body → 400 InvalidStampScan");

	const missingTarget = await postScan(ownerHeaders, { qrValue });
	if (missingTarget.status !== 400 || missingTarget.body.error?.type !== "InvalidStampScan") {
		console.error("❌ missing target should be 400:", missingTarget.status, missingTarget.body);
		process.exit(1);
	}

	console.log("✅ missing targetType/targetId → 400");

	for (let scan = 0; scan < 4; scan += 1) {
		const result = await postScan(ownerHeaders, {
			qrValue,
			targetType: "stamp_campaign",
			targetId: campaignAId,
		});
		if (result.status !== 200 || !hasOutcome(result.body.outcomes, "stamp_added")) {
			console.error(`❌ scan A #${scan + 1}:`, result.status, result.body);
			process.exit(1);
		}
	}

	const fifth = await postScan(ownerHeaders, {
		qrValue,
		targetType: "stamp_campaign",
		targetId: campaignAId,
	});
	const stampOutcome = fifth.body.outcomes?.find((outcome) => outcome.kind === "stamp_added");
	if (
		fifth.status !== 200 ||
		stampOutcome?.current !== 5 ||
		stampOutcome.required !== 10 ||
		stampOutcome.campaignName !== campaignAName
	) {
		console.error("❌ 5th scan stamp_added outcome:", fifth.body);
		process.exit(1);
	}

	const progressB = await prisma.customerStampProgress.findFirst({
		where: { tenantId: demoTenantId, customerId, campaignId: campaignBId },
	});
	if (progressB) {
		console.error("❌ campaign B should have no progress after scanning A only", progressB);
		process.exit(1);
	}

	console.log("✅ scan campaign A only mutates A (5 de 10)");

	const completeFirst = await postScan(ownerHeaders, {
		qrValue,
		targetType: "stamp_campaign",
		targetId: campaignCompleteId,
	});
	if (
		completeFirst.status !== 200 ||
		!hasOutcome(completeFirst.body.outcomes, "stamp_added") ||
		hasOutcome(completeFirst.body.outcomes, "card_completed")
	) {
		console.error("❌ first complete campaign scan:", completeFirst.body);
		process.exit(1);
	}

	const completeSecond = await postScan(ownerHeaders, {
		qrValue,
		targetType: "stamp_campaign",
		targetId: campaignCompleteId,
	});
	if (
		completeSecond.status !== 200 ||
		!hasOutcome(completeSecond.body.outcomes, "stamp_added") ||
		!hasOutcome(completeSecond.body.outcomes, "card_completed")
	) {
		console.error("❌ complete card scan:", completeSecond.body);
		process.exit(1);
	}

	const rescanCompleted = await postScan(ownerHeaders, {
		qrValue,
		targetType: "stamp_campaign",
		targetId: campaignCompleteId,
	});
	if (
		rescanCompleted.status !== 200 ||
		!hasOutcome(rescanCompleted.body.outcomes, "card_already_completed") ||
		hasOutcome(rescanCompleted.body.outcomes, "stamp_added")
	) {
		console.error("❌ rescan completed card:", rescanCompleted.body);
		process.exit(1);
	}

	console.log("✅ card_completed and card_already_completed outcomes");

	for (let use = 0; use < 2; use += 1) {
		const applied = await postScan(ownerHeaders, {
			qrValue,
			targetType: "promotion",
			targetId: promoId,
		});
		if (applied.status !== 200 || !hasOutcome(applied.body.outcomes, "promotion_applied")) {
			console.error(`❌ promo use #${use + 1}:`, applied.status, applied.body);
			process.exit(1);
		}
	}

	const exhausted = await postScan(ownerHeaders, {
		qrValue,
		targetType: "promotion",
		targetId: promoId,
	});
	if (
		exhausted.status !== 200 ||
		!hasOutcome(exhausted.body.outcomes, "promotion_exhausted") ||
		!hasOutcome(exhausted.body.outcomes, "point_recorded") ||
		hasOutcome(exhausted.body.outcomes, "promotion_applied")
	) {
		console.error("❌ promo exhausted:", exhausted.body);
		process.exit(1);
	}

	console.log("✅ promotion_exhausted + point_recorded");

	const orphanEmail = `record-target-orphan-${suffix}@example.local`;
	const orphanRegister = await fetch(`${apexBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Orphan Platform User",
			email: orphanEmail,
			password: "password123",
		}),
	});
	const orphanBody = (await orphanRegister.json()) as { user?: { id: string; qrValue: string | null } };
	if (orphanRegister.status !== 201 || !orphanBody.user?.id || !orphanBody.user.qrValue) {
		console.error("❌ orphan user register:", orphanRegister.status, orphanBody);
		process.exit(1);
	}

	const orphanQr = orphanBody.user.qrValue;
	const orphanUserId = orphanBody.user.id;

	const beforeCustomer = await prisma.customer.findFirst({
		where: { tenantId: demoTenantId, userId: orphanUserId },
	});
	if (beforeCustomer) {
		console.error("❌ orphan user should not have customer row yet", beforeCustomer);
		process.exit(1);
	}

	const autoJoinPromo = await postScan(ownerHeaders, {
		qrValue: orphanQr,
		targetType: "promotion",
		targetId: promoId,
	});
	if (autoJoinPromo.status !== 200 || !hasOutcome(autoJoinPromo.body.outcomes, "promotion_applied")) {
		console.error("❌ auto-join promo scan:", autoJoinPromo.status, autoJoinPromo.body);
		process.exit(1);
	}

	const joinedCustomer = await prisma.customer.findFirst({
		where: { tenantId: demoTenantId, userId: orphanUserId },
	});
	if (!joinedCustomer) {
		console.error("❌ auto-join should create customer row");
		process.exit(1);
	}

	console.log("✅ auto-join platform user QR on promotion scan");

	const promoUseRoute = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/promotions/${promoId}/use`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ qrValue }),
	});
	const promoUseBody = (await promoUseRoute.json()) as {
		customer?: { id: string };
		promotion?: { usedCount?: number };
		outcomes?: ScanOutcome[];
	};

	if (
		promoUseRoute.status !== 200 ||
		!promoUseBody.customer?.id ||
		(!promoUseBody.promotion && !promoUseBody.outcomes)
	) {
		console.error("❌ POST promotions/[id]/use delegation:", promoUseRoute.status, promoUseBody);
		process.exit(1);
	}

	console.log("✅ POST /api/loyalty/promotions/[id]/use delegates to unified scan");

	await fetch(`${brandingVerifyBaseUrl}/api/billing/tenant-plan`, {
		method: "PATCH",
		headers: ownerHeaders,
		body: JSON.stringify({ planId: restorePlanId }),
	});

	console.log("✅ verify:staff-scan-record-by-target passed");
}

void main();
