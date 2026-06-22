/* eslint-disable no-console -- shared verify helpers */

export type StaffScanOutcomeJson = {
	kind: string;
	current?: number;
	required?: number;
	campaignId?: string;
	campaignName?: string;
	pointsBalance?: number;
	expiresAt?: string;
	purchaseAmountEuros?: number;
	reasonCode?: string;
	message?: string;
};

export type StaffScanResponseJson = {
	customer?: { id: string; pointsBalance: number; visitsCount: number; name: string };
	outcomes?: StaffScanOutcomeJson[];
	error?: { type?: string; description?: string };
};

export function hasStaffScanOutcome(
	outcomes: StaffScanOutcomeJson[] | undefined,
	kind: string,
): boolean {
	return outcomes?.some((outcome) => outcome.kind === kind) ?? false;
}

export function findStampAddedOutcome(
	outcomes: StaffScanOutcomeJson[] | undefined,
	campaignId?: string,
): StaffScanOutcomeJson | undefined {
	return outcomes?.find(
		(outcome) =>
			outcome.kind === "stamp_added" &&
			(campaignId === undefined || outcome.campaignId === campaignId),
	);
}

export function campaignScanBody(
	qrValue: string,
	campaignId: string,
): { qrValue: string; targetType: "stamp_campaign"; targetId: string } {
	return { qrValue, targetType: "stamp_campaign", targetId: campaignId };
}

export async function postStaffScan(
	baseUrl: string,
	headers: Record<string, string>,
	body: Record<string, unknown>,
): Promise<{ status: number; body: StaffScanResponseJson }> {
	const response = await fetch(`${baseUrl}/api/loyalty/scan`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});

	return { status: response.status, body: (await response.json()) as StaffScanResponseJson };
}

type ScanTargetsResponse = {
	stampCampaigns?: { id: string }[];
	promotions?: { id: string }[];
};

export async function fetchFirstStampCampaignTargetId(
	baseUrl: string,
	headers: Record<string, string>,
): Promise<string | null> {
	const response = await fetch(`${baseUrl}/api/loyalty/scan/targets`, { headers });
	const body = (await response.json()) as ScanTargetsResponse;

	if (!response.ok) {
		return null;
	}

	return body.stampCampaigns?.[0]?.id ?? null;
}

export async function createVerifyStampCampaign(
	baseUrl: string,
	ownerHeaders: Record<string, string>,
	labelPrefix: string,
): Promise<{ campaignId: string; stampTypeId: string }> {
	const suffix = Date.now();
	const createType = await fetch(`${baseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({ label: `${labelPrefix} type ${suffix}` }),
	});
	const createTypeBody = (await createType.json()) as { stampType?: { id: string } };

	if (!createType.ok || !createTypeBody.stampType?.id) {
		throw new Error(`POST stamp-type failed: ${createType.status}`);
	}

	const stampTypeId = createTypeBody.stampType.id;
	const createCampaign = await fetch(`${baseUrl}/api/loyalty/stamp-campaigns`, {
		method: "POST",
		headers: ownerHeaders,
		body: JSON.stringify({
			name: `${labelPrefix} campaign ${suffix}`,
			requiredStamps: 10,
			stampTypeId,
		}),
	});
	const createCampaignBody = (await createCampaign.json()) as { campaign?: { id: string } };

	if (!createCampaign.ok || !createCampaignBody.campaign?.id) {
		throw new Error(`POST stamp-campaign failed: ${createCampaign.status}`);
	}

	return { campaignId: createCampaignBody.campaign.id, stampTypeId };
}

export async function resolveStampCampaignTargetId(
	baseUrl: string,
	ownerHeaders: Record<string, string>,
	labelPrefix: string,
): Promise<string> {
	const existing = await fetchFirstStampCampaignTargetId(baseUrl, ownerHeaders);
	if (existing) {
		return existing;
	}

	const created = await createVerifyStampCampaign(baseUrl, ownerHeaders, labelPrefix);

	return created.campaignId;
}

export function findRouletteSpinGrantedOutcome(
	outcomes: StaffScanOutcomeJson[] | undefined,
): StaffScanOutcomeJson | undefined {
	return outcomes?.find((outcome) => outcome.kind === "roulette_spin_granted");
}

export function findRouletteAuthGrantedOutcome(
	outcomes: StaffScanOutcomeJson[] | undefined,
): StaffScanOutcomeJson | undefined {
	return outcomes?.find((outcome) => outcome.kind === "roulette_auth_granted");
}

export function findRouletteAuthDeniedOutcome(
	outcomes: StaffScanOutcomeJson[] | undefined,
): StaffScanOutcomeJson | undefined {
	return outcomes?.find((outcome) => outcome.kind === "roulette_auth_denied");
}

export async function authorizeRouletteViaStaffScan(
	baseUrl: string,
	ownerHeaders: Record<string, string>,
	userQrValue: string,
	purchaseAmountEuros: number,
): Promise<{ expiresAt: string; purchaseAmountEuros: number }> {
	const scan = await postStaffScan(baseUrl, ownerHeaders, {
		qrValue: userQrValue,
		targetType: "roulette_authorize",
		purchaseAmountEuros,
	});
	const rouletteOutcome = findRouletteAuthGrantedOutcome(scan.body.outcomes);

	if (scan.status !== 200 || !rouletteOutcome?.expiresAt) {
		throw new Error(
			`staff authorize scan failed: ${scan.status} ${JSON.stringify(scan.body)}`,
		);
	}

	return {
		expiresAt: rouletteOutcome.expiresAt,
		purchaseAmountEuros: rouletteOutcome.purchaseAmountEuros ?? purchaseAmountEuros,
	};
}

export async function grantSpinEligibilityViaStaffScan(
	baseUrl: string,
	ownerHeaders: Record<string, string>,
	userQrValue: string,
	labelPrefix = "Roulette eligibility verify",
): Promise<{ expiresAt: string }> {
	const campaignId = await resolveStampCampaignTargetId(baseUrl, ownerHeaders, labelPrefix);
	const scan = await postStaffScan(
		baseUrl,
		ownerHeaders,
		campaignScanBody(userQrValue, campaignId),
	);
	const rouletteOutcome = findRouletteSpinGrantedOutcome(scan.body.outcomes);

	if (scan.status !== 200 || !rouletteOutcome?.expiresAt) {
		throw new Error(
			`staff scan did not grant roulette eligibility: ${scan.status} ${JSON.stringify(scan.body)}`,
		);
	}

	return { expiresAt: rouletteOutcome.expiresAt };
}
