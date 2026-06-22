import { Service } from "diod";

import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import { getParticipationRules } from "../../domain/RouletteConfig";
import type { RouletteParticipationViewStatus } from "../../domain/RouletteParticipation";
import { resolveParticipationViewStatus } from "../../domain/RouletteParticipationQuota";
import { RouletteParticipationRepository } from "../../domain/RouletteParticipationRepository";
import { RouletteSpinEligibilityRepository } from "../../domain/RouletteSpinEligibilityRepository";
import { ResolveRouletteParticipationUsage } from "./ResolveRouletteParticipationUsage";

export type GetRouletteParticipationStateParams = {
	tenantId: string;
	customerId: string;
};

export type GetRouletteParticipationStateResult = {
	status: RouletteParticipationViewStatus;
	enrolledAt: string | null;
	periodEndsAt: string | null;
	rules: {
		participationPeriodDays: number;
		maxSpinsInPeriod: number;
		maxSpinsPerDay: number;
		minPurchaseEuros: number | null;
		participationConditionsText: string | null;
		requiresEnrollment: boolean;
	};
	spinsUsedInPeriod: number;
	spinsRemainingInPeriod: number;
	spinsUsedToday: number;
	spinsRemainingToday: number;
	pendingAuthorization: { expiresAt: string } | null;
};

@Service()
export class GetRouletteParticipationState {
	constructor(
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
		private readonly participationRepository: RouletteParticipationRepository,
		private readonly eligibilityRepository: RouletteSpinEligibilityRepository,
		private readonly resolveUsage: ResolveRouletteParticipationUsage,
	) {}

	async execute(
		params: GetRouletteParticipationStateParams,
	): Promise<GetRouletteParticipationStateResult> {
		const activation = await this.getTenantRouletteConfig.execute({
			tenantId: params.tenantId,
		});

		const defaultRules = {
			participationPeriodDays: 7,
			maxSpinsInPeriod: 3,
			maxSpinsPerDay: 1,
			minPurchaseEuros: null as number | null,
			participationConditionsText: null as string | null,
			requiresEnrollment: true,
		};

		if (!activation.isEnabled || !activation.config) {
			return {
				status: "not_enrolled",
				enrolledAt: null,
				periodEndsAt: null,
				rules: defaultRules,
				spinsUsedInPeriod: 0,
				spinsRemainingInPeriod: 0,
				spinsUsedToday: 0,
				spinsRemainingToday: 0,
				pendingAuthorization: null,
			};
		}

		const rules = getParticipationRules(activation.config);
		const participation = await this.participationRepository.findByTenantAndCustomer(
			params.tenantId,
			params.customerId,
		);
		const usage = await this.resolveUsage.execute({
			tenantId: params.tenantId,
			customerId: params.customerId,
			participation,
			rules,
		});
		const activeEligibility = await this.eligibilityRepository.findActiveByCustomer(
			params.tenantId,
			params.customerId,
		);

		const status = resolveParticipationViewStatus({
			participation,
			usage,
			hasPendingAuthorization: activeEligibility !== null,
		});

		return {
			status,
			enrolledAt: participation?.toPrimitives().enrolledAt ?? null,
			periodEndsAt: participation?.toPrimitives().periodEndsAt ?? null,
			rules: {
				participationPeriodDays: rules.participationPeriodDays,
				maxSpinsInPeriod: rules.maxSpinsInPeriod,
				maxSpinsPerDay: rules.maxSpinsPerDay,
				minPurchaseEuros: rules.minPurchaseEuros,
				participationConditionsText: rules.participationConditionsText,
				requiresEnrollment: rules.requiresEnrollment,
			},
			spinsUsedInPeriod: usage.spinsUsedInPeriod,
			spinsRemainingInPeriod: usage.spinsRemainingInPeriod,
			spinsUsedToday: usage.spinsUsedToday,
			spinsRemainingToday: usage.spinsRemainingToday,
			pendingAuthorization: activeEligibility
				? { expiresAt: activeEligibility.toPrimitives().expiresAt }
				: null,
		};
	}
}
