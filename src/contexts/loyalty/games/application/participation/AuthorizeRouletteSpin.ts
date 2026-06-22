import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { isOwnerVisiblePlatformGameStatus } from "../../../../platform/domain/PlatformGameStatus";
import { PlatformGameRepository } from "../../../../platform/domain/PlatformGameRepository";
import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import {
	getParticipationRules,
	usesStaffExplicitAuthorization,
} from "../../domain/RouletteConfig";
import { RouletteGameDisabled } from "../../domain/RouletteGameDisabled";
import { RouletteGameNotAvailable } from "../../domain/RouletteGameNotAvailable";
import { RouletteMinPurchaseNotMet } from "../../domain/RouletteMinPurchaseNotMet";
import { RouletteNotEnrolled } from "../../domain/RouletteNotEnrolled";
import { RouletteParticipationPeriodExpired } from "../../domain/RouletteParticipationPeriodExpired";
import { meetsMinPurchaseEuros } from "../../domain/RouletteParticipationQuota";
import { RouletteParticipationRepository } from "../../domain/RouletteParticipationRepository";
import { RoulettePendingAuthorization } from "../../domain/RoulettePendingAuthorization";
import { RouletteQuotaExhausted } from "../../domain/RouletteQuotaExhausted";
import { RouletteSpinEligibility } from "../../domain/RouletteSpinEligibility";
import { RouletteSpinEligibilityRepository } from "../../domain/RouletteSpinEligibilityRepository";
import { RULETA_GAME_SLUG } from "../../domain/TenantGameActivation";
import { ResolveRouletteParticipationUsage } from "./ResolveRouletteParticipationUsage";

export type AuthorizeRouletteSpinParams = {
	tenantId: string;
	customerId: string;
	purchaseAmountEuros: number;
	triggerRef?: string | null;
};

export type AuthorizeRouletteSpinResult = {
	eligibilityId: string;
	expiresAt: string;
};

@Service()
export class AuthorizeRouletteSpin {
	constructor(
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly platformGameRepository: PlatformGameRepository,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
		private readonly participationRepository: RouletteParticipationRepository,
		private readonly eligibilityRepository: RouletteSpinEligibilityRepository,
		private readonly resolveUsage: ResolveRouletteParticipationUsage,
	) {}

	async execute(params: AuthorizeRouletteSpinParams): Promise<AuthorizeRouletteSpinResult> {
		if (!Number.isFinite(params.purchaseAmountEuros) || params.purchaseAmountEuros < 0) {
			throw new RouletteMinPurchaseNotMet(params.purchaseAmountEuros, 0);
		}

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
			throw new RouletteGameDisabled("Roulette staff authorization is not enabled");
		}

		const rules = getParticipationRules(activation.config);
		const participation = await this.participationRepository.findByTenantAndCustomer(
			params.tenantId,
			params.customerId,
		);
		const now = new Date();

		if (rules.requiresEnrollment && !participation) {
			throw new RouletteNotEnrolled();
		}

		if (participation && !participation.isPeriodActive(now)) {
			throw new RouletteParticipationPeriodExpired();
		}

		const pending = await this.eligibilityRepository.findActiveByCustomer(
			params.tenantId,
			params.customerId,
			now,
		);

		if (pending) {
			throw new RoulettePendingAuthorization();
		}

		if (
			rules.minPurchaseEuros !== null &&
			!meetsMinPurchaseEuros(params.purchaseAmountEuros, rules.minPurchaseEuros)
		) {
			throw new RouletteMinPurchaseNotMet(params.purchaseAmountEuros, rules.minPurchaseEuros);
		}

		const usage = await this.resolveUsage.execute({
			tenantId: params.tenantId,
			customerId: params.customerId,
			participation,
			rules,
			at: now,
		});

		if (usage.spinsRemainingInPeriod <= 0) {
			throw new RouletteQuotaExhausted("period", rules.maxSpinsInPeriod);
		}

		if (usage.spinsRemainingToday <= 0) {
			throw new RouletteQuotaExhausted("daily", rules.maxSpinsPerDay);
		}

		const expiresAt = new Date(now.getTime() + rules.eligibilityTtlHours * 60 * 60 * 1000);
		const eligibility = RouletteSpinEligibility.create({
			tenantId: params.tenantId,
			customerId: params.customerId,
			expiresAt,
			triggerRef: params.triggerRef,
			authorizedPurchaseEuros: params.purchaseAmountEuros,
		});

		await this.eligibilityRepository.save(eligibility);

		const saved = eligibility.toPrimitives();

		return {
			eligibilityId: saved.id,
			expiresAt: saved.expiresAt,
		};
	}
}
