import { InvalidStampScan } from "./InvalidStampScan";

export const STAFF_SCAN_TARGET_TYPES = ["stamp_campaign", "promotion"] as const;

export type StaffScanTargetType = (typeof STAFF_SCAN_TARGET_TYPES)[number];

export type StaffScanTargetInput = {
	targetType: StaffScanTargetType;
	targetId: string;
};

const TARGET_TYPE_SET = new Set<string>(STAFF_SCAN_TARGET_TYPES);

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
