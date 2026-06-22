import { Service } from "diod";

import {
	buildConditionsLabel,
	resolveBlockReason,
	resolveClientParticipationStatus,
	type ClientParticipationStatus,
	type RouletteAuthorizationMode,
	type RouletteBlockReason,
	type RouletteRecentSpinView,
} from "../../../../../lib/roulette/rouletteClientState";
import { GetRouletteParticipationState } from "../participation/GetRouletteParticipationState";
import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import {
	getRateLimitRules,
	usesLegacyStaffScanAuthorization,
	usesStaffExplicitAuthorization,
} from "../../domain/RouletteConfig";
import { AssertRouletteSpinAccess } from "./AssertRouletteSpinAccess";
import { ListRecentRouletteSpinsForCustomer } from "./ListRecentRouletteSpinsForCustomer";
import { RouletteSpinEligibilityRepository } from "../../domain/RouletteSpinEligibilityRepository";

export type GetRoulettePublicStateParams = {
	tenantId: string;
	customerId: string;
};

export type RoulettePublicSegment = {
	id: string;
	label: string;
	color?: string;
};

export type GetRoulettePublicStateResult = {
	isEnabled: boolean;
	canSpin: boolean;
	segments: RoulettePublicSegment[];
	rules: {
		maxSpinsPerDay: number;
		maxSpinsPerWeek: number;
		eligibilityTtlHours: number;
	};
	eligibility: { expiresAt: string } | null;
	authorizationMode: RouletteAuthorizationMode;
	participationStatus: ClientParticipationStatus | null;
	spinsRemainingInPeriod: number | null;
	spinsUsedInPeriod: number | null;
	spinsRemainingToday: number | null;
	spinsUsedToday: number | null;
	minPurchaseEuros: number | null;
	conditionsLabel: string | null;
	periodEndsAt: string | null;
	enrolledAt: string | null;
	recentSpins: RouletteRecentSpinView[];
	blockReason: RouletteBlockReason;
};

const DEFAULT_RULES = {
	maxSpinsPerDay: 1,
	maxSpinsPerWeek: 3,
	eligibilityTtlHours: 24,
};

const EMPTY_V2_FIELDS = {
	participationStatus: null as ClientParticipationStatus | null,
	spinsRemainingInPeriod: null,
	spinsUsedInPeriod: null,
	spinsRemainingToday: null,
	spinsUsedToday: null,
	minPurchaseEuros: null,
	conditionsLabel: null,
	periodEndsAt: null,
	enrolledAt: null,
	recentSpins: [] as RouletteRecentSpinView[],
	blockReason: null as RouletteBlockReason,
};

@Service()
export class GetRoulettePublicState {
	constructor(
		private readonly assertRouletteSpinAccess: AssertRouletteSpinAccess,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
		private readonly getParticipationState: GetRouletteParticipationState,
		private readonly listRecentSpins: ListRecentRouletteSpinsForCustomer,
		private readonly eligibilityRepository: RouletteSpinEligibilityRepository,
	) {}

	async execute(params: GetRoulettePublicStateParams): Promise<GetRoulettePublicStateResult> {
		const activation = await this.getTenantRouletteConfig.execute({
			tenantId: params.tenantId,
		});

		if (!activation.isEnabled || !activation.config) {
			return {
				isEnabled: activation.isEnabled,
				canSpin: false,
				segments: [],
				rules: activation.config
					? getRateLimitRules(activation.config)
					: DEFAULT_RULES,
				eligibility: null,
				authorizationMode: "after_staff_scan",
				...EMPTY_V2_FIELDS,
				blockReason: activation.isEnabled ? null : "disabled",
			};
		}

		const config = activation.config;
		const authorizationMode: RouletteAuthorizationMode = usesStaffExplicitAuthorization(config)
			? "staff_explicit"
			: "after_staff_scan";

		if (usesLegacyStaffScanAuthorization(config)) {
			return this.buildLegacyState(params, config);
		}

		return this.buildStaffExplicitState(params, config, authorizationMode);
	}

	private async buildLegacyState(
		params: GetRoulettePublicStateParams,
		config: NonNullable<
			Awaited<ReturnType<GetTenantRouletteConfig["execute"]>>["config"]
		>,
	): Promise<GetRoulettePublicStateResult> {
		const primitives = config.toPrimitives();
		const segments = primitives.segments.map((segment) => ({
			id: segment.id,
			label: segment.label,
			color: segment.color,
		}));
		const rules = getRateLimitRules(config);

		const activeEligibility = await this.eligibilityRepository.findActiveByCustomer(
			params.tenantId,
			params.customerId,
		);
		const eligibility = activeEligibility
			? { expiresAt: activeEligibility.toPrimitives().expiresAt }
			: null;

		let gatesPass = false;

		try {
			await this.assertRouletteSpinAccess.execute(params);
			gatesPass = true;
		} catch {
			gatesPass = false;
		}

		const canSpin = gatesPass && activeEligibility !== null;

		return {
			isEnabled: true,
			canSpin,
			segments,
			rules,
			eligibility,
			authorizationMode: "after_staff_scan",
			...EMPTY_V2_FIELDS,
			blockReason: canSpin ? null : eligibility ? "rate_limit" : "awaiting_staff_authorization",
		};
	}

	private async buildStaffExplicitState(
		params: GetRoulettePublicStateParams,
		config: NonNullable<
			Awaited<ReturnType<GetTenantRouletteConfig["execute"]>>["config"]
		>,
		authorizationMode: RouletteAuthorizationMode,
	): Promise<GetRoulettePublicStateResult> {
		const primitives = config.toPrimitives();
		const segments = primitives.segments.map((segment) => ({
			id: segment.id,
			label: segment.label,
			color: segment.color,
		}));
		const rules = getRateLimitRules(config);

		const [participation, recentSpins] = await Promise.all([
			this.getParticipationState.execute(params),
			this.listRecentSpins.execute(params),
		]);

		const eligibility = participation.pendingAuthorization;
		const hasPendingAuthorization = eligibility !== null;

		let gatesPass = false;

		try {
			await this.assertRouletteSpinAccess.execute(params);
			gatesPass = true;
		} catch {
			gatesPass = false;
		}

		const domainAllowsSpin =
			participation.status === "active" && hasPendingAuthorization;
		const canSpin = domainAllowsSpin && gatesPass;

		const participationStatus = resolveClientParticipationStatus({
			isEnabled: true,
			domainStatus: participation.status,
			canSpin,
		});

		const blockReason = resolveBlockReason({
			isEnabled: true,
			participationStatus,
			canSpin,
			hasPendingAuthorization,
		});

		return {
			isEnabled: true,
			canSpin,
			segments,
			rules,
			eligibility,
			authorizationMode,
			participationStatus,
			spinsRemainingInPeriod: participation.spinsRemainingInPeriod,
			spinsUsedInPeriod: participation.spinsUsedInPeriod,
			spinsRemainingToday: participation.spinsRemainingToday,
			spinsUsedToday: participation.spinsUsedToday,
			minPurchaseEuros: participation.rules.minPurchaseEuros,
			conditionsLabel: buildConditionsLabel({
				participationConditionsText: participation.rules.participationConditionsText,
				minPurchaseEuros: participation.rules.minPurchaseEuros,
			}),
			periodEndsAt: participation.periodEndsAt,
			enrolledAt: participation.enrolledAt,
			recentSpins,
			blockReason,
		};
	}
}
