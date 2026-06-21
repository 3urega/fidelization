import type { RoulettePrizeType } from "./RoulettePrizeType";
import type { RouletteSegmentPrize } from "./RouletteSegment";
import type { RouletteSpinEligibility } from "./RouletteSpinEligibility";
import type { RouletteSpin } from "./RouletteSpin";
import type { TenantGameActivation } from "./TenantGameActivation";

export type RouletteSpinPrizeApplication = {
	prizeType: RoulettePrizeType;
	prize: RouletteSegmentPrize;
	tenantId: string;
	customerId: string;
	userId: string;
	spinId: string;
};

export type RouletteSpinUnitOfWorkParams = {
	spin: RouletteSpin;
	activation: TenantGameActivation;
	prizeApplication: RouletteSpinPrizeApplication | null;
	eligibilityToConsume: RouletteSpinEligibility;
};

export abstract class RouletteSpinUnitOfWork {
	abstract execute(params: RouletteSpinUnitOfWorkParams): Promise<void>;
}
