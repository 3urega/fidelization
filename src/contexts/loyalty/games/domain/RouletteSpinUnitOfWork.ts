import type { RoulettePrizeType } from "../domain/RoulettePrizeType";
import type { RouletteSegmentPrize } from "../domain/RouletteSegment";
import type { RouletteSpin } from "../domain/RouletteSpin";
import type { TenantGameActivation } from "../domain/TenantGameActivation";

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
};

export abstract class RouletteSpinUnitOfWork {
	abstract execute(params: RouletteSpinUnitOfWorkParams): Promise<void>;
}
