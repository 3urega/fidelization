import { InvalidStampScan } from "./InvalidStampScan";

export const STAFF_SCAN_TARGET_TYPES = [
	"stamp_campaign",
	"promotion",
	"roulette_authorize",
] as const;

export type StaffScanTargetType = (typeof STAFF_SCAN_TARGET_TYPES)[number];

export const ROULETTE_AUTHORIZE_TARGET_ID = "ruleta";

export type StaffScanTargetInput = {
	targetType: StaffScanTargetType;
	targetId: string;
};

const TARGET_TYPE_SET = new Set<string>(STAFF_SCAN_TARGET_TYPES);

export function isRouletteAuthorizeTarget(targetType: StaffScanTargetType): boolean {
	return targetType === "roulette_authorize";
}

export function parseStaffScanTargetInput(input: {
	targetType?: unknown;
	targetId?: unknown;
}): StaffScanTargetInput {
	const { targetType, targetId } = input;

	if (targetType === undefined || targetType === null || targetType === "") {
		throw new InvalidStampScan("targetType is required");
	}

	if (typeof targetType !== "string" || !TARGET_TYPE_SET.has(targetType)) {
		throw new InvalidStampScan(`Invalid targetType: ${String(targetType)}`);
	}

	if (targetType === "roulette_authorize") {
		const resolvedTargetId =
			typeof targetId === "string" && targetId.trim() !== ""
				? targetId.trim()
				: ROULETTE_AUTHORIZE_TARGET_ID;

		return {
			targetType: "roulette_authorize",
			targetId: resolvedTargetId,
		};
	}

	if (targetId === undefined || targetId === null) {
		throw new InvalidStampScan("targetId is required");
	}

	if (typeof targetId !== "string" || targetId.trim() === "") {
		throw new InvalidStampScan("targetId must be a non-empty string");
	}

	return {
		targetType: targetType as StaffScanTargetType,
		targetId: targetId.trim(),
	};
}
