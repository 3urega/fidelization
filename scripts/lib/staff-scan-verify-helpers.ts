/* eslint-disable no-console -- shared verify helpers */

export type StaffScanOutcomeJson = {
	kind: string;
	current?: number;
	required?: number;
	campaignId?: string;
	campaignName?: string;
	pointsBalance?: number;
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
