import type { RoulettePrizeType } from "./RoulettePrizeType";
import type { RouletteSpinStatus } from "./RouletteSpin";

export type RouletteActivityPrizeSummary = {
	segmentId: string;
	label: string;
	spinCount: number;
	distinctCustomers: number;
};

export type RouletteActivitySpinRow = {
	spinId: string;
	customerId: string;
	customerName: string;
	segmentId: string;
	segmentLabel: string;
	prizeType: RoulettePrizeType;
	status: RouletteSpinStatus;
	createdAt: Date;
	redeemedAt: Date | null;
};

export type RouletteSpinTenantReadRow = {
	spinId: string;
	customerId: string;
	customerName: string;
	segmentId: string;
	segmentIndex: number;
	prizeType: RoulettePrizeType;
	status: RouletteSpinStatus;
	createdAt: Date;
	redeemedAt: Date | null;
	segmentLabel: string;
};
