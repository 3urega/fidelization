import { Service } from "diod";

import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import { AssertRouletteSpinAccess } from "./AssertRouletteSpinAccess";

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
	};
};

@Service()
export class GetRoulettePublicState {
	constructor(
		private readonly assertRouletteSpinAccess: AssertRouletteSpinAccess,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
	) {}

	async execute(params: GetRoulettePublicStateParams): Promise<GetRoulettePublicStateResult> {
		try {
			await this.assertRouletteSpinAccess.execute(params);
		} catch {
			const activation = await this.getTenantRouletteConfig.execute({
				tenantId: params.tenantId,
			});

			return {
				isEnabled: activation.isEnabled,
				canSpin: false,
				segments: [],
				rules: activation.config
					? {
							maxSpinsPerDay: activation.config.toPrimitives().rules.maxSpinsPerDay,
							maxSpinsPerWeek: activation.config.toPrimitives().rules.maxSpinsPerWeek,
						}
					: { maxSpinsPerDay: 1, maxSpinsPerWeek: 3 },
			};
		}

		const activation = await this.getTenantRouletteConfig.execute({
			tenantId: params.tenantId,
		});

		if (!activation.config) {
			return {
				isEnabled: false,
				canSpin: false,
				segments: [],
				rules: { maxSpinsPerDay: 1, maxSpinsPerWeek: 3 },
			};
		}

		const primitives = activation.config.toPrimitives();

		return {
			isEnabled: activation.isEnabled,
			canSpin: true,
			segments: primitives.segments.map((segment) => ({
				id: segment.id,
				label: segment.label,
				color: segment.color,
			})),
			rules: {
				maxSpinsPerDay: primitives.rules.maxSpinsPerDay,
				maxSpinsPerWeek: primitives.rules.maxSpinsPerWeek,
			},
		};
	}
}
