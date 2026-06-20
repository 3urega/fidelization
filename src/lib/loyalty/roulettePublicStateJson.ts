import type { ExecuteRouletteSpinResult } from "../../contexts/loyalty/games/application/spin/ExecuteRouletteSpin";
import type { GetRoulettePublicStateResult } from "../../contexts/loyalty/games/application/spin/GetRoulettePublicState";

export function roulettePublicStateToJson(
	state: GetRoulettePublicStateResult,
): Record<string, unknown> {
	return {
		isEnabled: state.isEnabled,
		canSpin: state.canSpin,
		segments: state.segments,
		rules: state.rules,
	};
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
