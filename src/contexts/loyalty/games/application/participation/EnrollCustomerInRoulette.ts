import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { isOwnerVisiblePlatformGameStatus } from "../../../../platform/domain/PlatformGameStatus";
import { PlatformGameRepository } from "../../../../platform/domain/PlatformGameRepository";
import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import {
	getParticipationRules,
	usesStaffExplicitAuthorization,
} from "../../domain/RouletteConfig";
import { computeParticipationPeriodEndsAt } from "../../domain/RouletteParticipationQuota";
import { RouletteGameDisabled } from "../../domain/RouletteGameDisabled";
import { RouletteGameNotAvailable } from "../../domain/RouletteGameNotAvailable";
import { RouletteParticipation } from "../../domain/RouletteParticipation";
import { RouletteParticipationRepository } from "../../domain/RouletteParticipationRepository";
import { RULETA_GAME_SLUG } from "../../domain/TenantGameActivation";

export type EnrollCustomerInRouletteParams = {
	tenantId: string;
	customerId: string;
};

export type EnrollCustomerInRouletteResult = {
	participationId: string;
	enrolledAt: string;
	periodEndsAt: string;
	status: "active";
};

@Service()
export class EnrollCustomerInRoulette {
	constructor(
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly platformGameRepository: PlatformGameRepository,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
		private readonly participationRepository: RouletteParticipationRepository,
	) {}

	async execute(params: EnrollCustomerInRouletteParams): Promise<EnrollCustomerInRouletteResult> {
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "gamification",
		});

		const platformGame = await this.platformGameRepository.searchBySlug(RULETA_GAME_SLUG);

		if (!platformGame || !isOwnerVisiblePlatformGameStatus(platformGame.toPrimitives().status)) {
			throw new RouletteGameNotAvailable("Roulette is not available for this establishment");
		}

		const activation = await this.getTenantRouletteConfig.execute({
			tenantId: params.tenantId,
		});

		if (!activation.isEnabled || !activation.config) {
			throw new RouletteGameDisabled();
		}

		if (!usesStaffExplicitAuthorization(activation.config)) {
			throw new RouletteGameDisabled("Roulette participation enrollment is not enabled");
		}

		const rules = getParticipationRules(activation.config);
		const enrolledAt = new Date();
		const periodEndsAt = computeParticipationPeriodEndsAt(enrolledAt, rules.participationPeriodDays);
		const existing = await this.participationRepository.findByTenantAndCustomer(
			params.tenantId,
			params.customerId,
		);

		let participation: RouletteParticipation;

		if (existing && existing.isPeriodActive(enrolledAt)) {
			participation = existing.withStatus("active");
		} else if (existing) {
			participation = existing.renew({ enrolledAt, periodEndsAt });
		} else {
			participation = RouletteParticipation.enroll({
				tenantId: params.tenantId,
				customerId: params.customerId,
				enrolledAt,
				periodEndsAt,
			});
		}

		await this.participationRepository.save(participation);

		const saved = participation.toPrimitives();

		return {
			participationId: saved.id,
			enrolledAt: saved.enrolledAt,
			periodEndsAt: saved.periodEndsAt,
			status: "active",
		};
	}
}
