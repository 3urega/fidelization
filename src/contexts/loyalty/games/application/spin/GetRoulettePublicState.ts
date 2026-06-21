import { Service } from "diod";

import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import { AssertRouletteSpinAccess } from "./AssertRouletteSpinAccess";
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
};

const DEFAULT_RULES = {
	maxSpinsPerDay: 1,
	maxSpinsPerWeek: 3,
	eligibilityTtlHours: 24,
};

@Service()
export class GetRoulettePublicState {
	constructor(
		private readonly assertRouletteSpinAccess: AssertRouletteSpinAccess,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
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
					? {
							maxSpinsPerDay: activation.config.toPrimitives().rules.maxSpinsPerDay,
							maxSpinsPerWeek: activation.config.toPrimitives().rules.maxSpinsPerWeek,
							eligibilityTtlHours: activation.config.toPrimitives().rules.eligibilityTtlHours,
						}
					: DEFAULT_RULES,
				eligibility: null,
			};
		}

		const primitives = activation.config.toPrimitives();
		const segments = primitives.segments.map((segment) => ({
			id: segment.id,
			label: segment.label,
			color: segment.color,
		}));
		const rules = {
			maxSpinsPerDay: primitives.rules.maxSpinsPerDay,
			maxSpinsPerWeek: primitives.rules.maxSpinsPerWeek,
			eligibilityTtlHours: primitives.rules.eligibilityTtlHours,
		};

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

		return {
			isEnabled: true,
			canSpin: gatesPass && activeEligibility !== null,
			segments,
			rules,
			eligibility,
		};
	}
}
