import { Service } from "diod";
import type { Prisma } from "@prisma/client";

import { prisma } from "../../../../lib/prisma";
import { ApplyCustomerLoyaltyOutcome } from "../../customers/application/loyalty/ApplyCustomerLoyaltyOutcome";
import {
	RouletteSpinUnitOfWork,
	type RouletteSpinUnitOfWorkParams,
} from "../domain/RouletteSpinUnitOfWork";

@Service()
export class PrismaRouletteSpinUnitOfWork extends RouletteSpinUnitOfWork {
	constructor(private readonly applyLoyaltyOutcome: ApplyCustomerLoyaltyOutcome) {
		super();
	}

	async execute(params: RouletteSpinUnitOfWorkParams): Promise<void> {
		const spin = params.spin.toPrimitives();
		const activation = params.activation.toPrimitives();
		const eligibility = params.eligibilityToConsume.toPrimitives();

		await prisma.$transaction(async (tx) => {
			await tx.rouletteSpin.create({
				data: {
					id: spin.id,
					tenantId: spin.tenantId,
					customerId: spin.customerId,
					segmentId: spin.segmentId,
					segmentIndex: spin.segmentIndex,
					prizeType: spin.prizeType,
					prizePayload: spin.prizePayload as Prisma.InputJsonValue,
					status: spin.status,
					triggerSource: spin.triggerSource,
					triggerRef: spin.triggerRef,
					idempotencyKey: spin.idempotencyKey,
					configSnapshot: spin.configSnapshot as Prisma.InputJsonValue,
					createdAt: new Date(spin.createdAt),
					redeemedAt: spin.redeemedAt ? new Date(spin.redeemedAt) : null,
				},
			});

			await tx.tenantGameActivation.update({
				where: {
					tenantId_gameSlug: {
						tenantId: activation.tenantId,
						gameSlug: activation.gameSlug,
					},
				},
				data: {
					isEnabled: activation.isEnabled,
					config: activation.config as Prisma.InputJsonValue,
				},
			});

			await tx.rouletteSpinEligibility.update({
				where: { id: eligibility.id },
				data: {
					consumedAt: eligibility.consumedAt ? new Date(eligibility.consumedAt) : new Date(),
					consumedSpinId: eligibility.consumedSpinId,
				},
			});
		});

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
