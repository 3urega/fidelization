import type { ExecuteRouletteSpinResult } from "../../contexts/loyalty/games/application/spin/ExecuteRouletteSpin";
import type { GetRoulettePublicStateResult } from "../../contexts/loyalty/games/application/spin/GetRoulettePublicState";

export function roulettePublicStateToJson(
	state: GetRoulettePublicStateResult,
): Record<string, unknown> {
	const payload: Record<string, unknown> = {
		isEnabled: state.isEnabled,
		canSpin: state.canSpin,
		segments: state.segments,
		rules: state.rules,
		eligibility: state.eligibility,
		authorizationMode: state.authorizationMode,
	};

	if (state.authorizationMode === "staff_explicit") {
		payload.participationStatus = state.participationStatus;
		payload.spinsRemainingInPeriod = state.spinsRemainingInPeriod;
		payload.spinsUsedInPeriod = state.spinsUsedInPeriod;
		payload.spinsRemainingToday = state.spinsRemainingToday;
		payload.spinsUsedToday = state.spinsUsedToday;
		payload.minPurchaseEuros = state.minPurchaseEuros;
		payload.conditionsLabel = state.conditionsLabel;
		payload.periodEndsAt = state.periodEndsAt;
		payload.enrolledAt = state.enrolledAt;
		payload.recentSpins = state.recentSpins;
		payload.blockReason = state.blockReason;
	}

	return payload;
}

export function rouletteSpinResultToJson(
	result: ExecuteRouletteSpinResult,
): Record<string, unknown> {
	return {
		spinId: result.spinId,
		segmentIndex: result.segmentIndex,
		segmentLabel: result.segmentLabel,
		prizeType: result.prizeType,
		prize: result.prize,
		status: result.status,
	};
}

export function rouletteEnrollResultToJson(result: {
	participationId: string;
	enrolledAt: string;
	periodEndsAt: string;
	status: string;
}): Record<string, unknown> {
	return {
		participationId: result.participationId,
		enrolledAt: result.enrolledAt,
		periodEndsAt: result.periodEndsAt,
		status: result.status,
	};
}
