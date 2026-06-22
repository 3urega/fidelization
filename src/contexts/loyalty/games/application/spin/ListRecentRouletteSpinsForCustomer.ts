import { Service } from "diod";

import {
	formatRouletteSpinPrizeSummary,
	type RouletteRecentSpinView,
} from "../../../../../lib/roulette/rouletteClientState";
import type { RoulettePrizeType } from "../../domain/RoulettePrizeType";
import type { RouletteSegmentPrize } from "../../domain/RouletteSegment";
import type { RouletteSpinStatus } from "../../domain/RouletteSpin";
import { RouletteSpinRepository } from "../../domain/RouletteSpinRepository";

export type ListRecentRouletteSpinsForCustomerParams = {
	tenantId: string;
	customerId: string;
	limit?: number;
};

@Service()
export class ListRecentRouletteSpinsForCustomer {
	constructor(private readonly spinRepository: RouletteSpinRepository) {}

	async execute(
		params: ListRecentRouletteSpinsForCustomerParams,
	): Promise<RouletteRecentSpinView[]> {
		const limit = params.limit ?? 10;
		const spins = await this.spinRepository.listRecentByCustomer(
			params.tenantId,
			params.customerId,
			limit,
		);

		return spins.map((spin) => {
			const primitives = spin.toPrimitives();
			const segment = primitives.configSnapshot.segments[primitives.segmentIndex];

			return {
				spinId: primitives.id,
				createdAt: primitives.createdAt,
				segmentLabel: segment?.label ?? `Segmento ${primitives.segmentIndex + 1}`,
				prizeType: primitives.prizeType as RoulettePrizeType,
				prizeSummary: formatRouletteSpinPrizeSummary(
					primitives.prizeType as RoulettePrizeType,
					primitives.prizePayload as RouletteSegmentPrize,
					primitives.status as RouletteSpinStatus,
				),
				status: primitives.status as RouletteSpinStatus,
				redeemedAt: primitives.redeemedAt,
			};
		});
	}
}
