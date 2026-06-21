import type { ListPendingRouletteSpinsForStaffResult } from "../../contexts/loyalty/games/application/redeem/ListPendingRouletteSpinsForStaff";
import type { RedeemRouletteSpinResult } from "../../contexts/loyalty/games/application/redeem/RedeemRouletteSpin";

export function redeemRouletteSpinResultToJson(
	result: RedeemRouletteSpinResult,
): Record<string, unknown> {
	return {
		spinId: result.spinId,
		status: result.status,
		redeemedAt: result.redeemedAt,
		segmentLabel: result.segmentLabel,
		prizeDescription: result.prizeDescription,
		customerId: result.customerId,
	};
}

export function pendingRouletteSpinsForStaffToJson(
	result: ListPendingRouletteSpinsForStaffResult,
): Record<string, unknown> {
	return {
		customerId: result.customerId,
		customerName: result.customerName,
		pendingSpins: result.pendingSpins,
	};
}
