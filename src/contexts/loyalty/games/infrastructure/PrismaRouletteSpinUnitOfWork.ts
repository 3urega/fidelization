import { Service } from "diod";

import { ApplyCustomerLoyaltyOutcome } from "../../../customers/application/loyalty/ApplyCustomerLoyaltyOutcome";
import {
	RouletteSpinUnitOfWork,
	type RouletteSpinUnitOfWorkParams,
} from "../domain/RouletteSpinUnitOfWork";
import { RouletteSpinRepository } from "../domain/RouletteSpinRepository";
import { TenantGameActivationRepository } from "../domain/TenantGameActivationRepository";

@Service()
export class PrismaRouletteSpinUnitOfWork extends RouletteSpinUnitOfWork {
	constructor(
		private readonly spinRepository: RouletteSpinRepository,
		private readonly activationRepository: TenantGameActivationRepository,
		private readonly applyLoyaltyOutcome: ApplyCustomerLoyaltyOutcome,
	) {
		super();
	}

	async execute(params: RouletteSpinUnitOfWorkParams): Promise<void> {
		await this.spinRepository.save(params.spin);
		await this.activationRepository.save(params.activation);

		const prize = params.prizeApplication;

		if (!prize) {
			return;
		}

		const metadata = {
			source: "roulette_spin",
			spinId: prize.spinId,
		};

		if (prize.prizeType === "points") {
			const points = prize.prize.points;

			if (!points || points < 1) {
				return;
			}

			await this.applyLoyaltyOutcome.applyPoints({
				tenantId: prize.tenantId,
				customerId: prize.customerId,
				points,
				createdByUserId: prize.userId,
				metadata,
			});

			return;
		}

		if (prize.prizeType === "stamp") {
			const campaignId = prize.prize.campaignId;

			if (!campaignId) {
				return;
			}

			await this.applyLoyaltyOutcome.applyStamp({
				tenantId: prize.tenantId,
				customerId: prize.customerId,
				campaignId,
				createdByUserId: prize.userId,
				metadata,
			});

			return;
		}

		if (prize.prizeType === "promotion") {
			const promotionId = prize.prize.promotionId;

			if (!promotionId) {
				return;
			}

			await this.applyLoyaltyOutcome.applyPromotion({
				tenantId: prize.tenantId,
				customerId: prize.customerId,
				promotionId,
				createdByUserId: prize.userId,
				metadata,
			});
		}
	}
}
