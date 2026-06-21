import { randomUUID } from "crypto";

import type { RoulettePrizeType } from "./RoulettePrizeType";
import type { RouletteConfigPrimitives } from "./RouletteConfig";
import type { RouletteSegmentPrize } from "./RouletteSegment";
import { RouletteSpinAlreadyRedeemed } from "./RouletteSpinAlreadyRedeemed";
import { RouletteSpinNotPendingRedeem } from "./RouletteSpinNotPendingRedeem";

export const ROULETTE_SPIN_STATUSES = ["pending_redeem", "applied", "expired"] as const;
export type RouletteSpinStatus = (typeof ROULETTE_SPIN_STATUSES)[number];

export const ROULETTE_SPIN_TRIGGER_SOURCES = ["staff_scan", "manual", "campaign"] as const;
export type RouletteSpinTriggerSource = (typeof ROULETTE_SPIN_TRIGGER_SOURCES)[number];

export type RouletteSpinPrimitives = {
	id: string;
	tenantId: string;
	customerId: string;
	segmentId: string;
	segmentIndex: number;
	prizeType: RoulettePrizeType;
	prizePayload: RouletteSegmentPrize;
	status: RouletteSpinStatus;
	triggerSource: RouletteSpinTriggerSource;
	triggerRef: string | null;
	idempotencyKey: string | null;
	configSnapshot: RouletteConfigPrimitives;
	createdAt: string;
	redeemedAt: string | null;
};

export type RouletteSpinCreateParams = {
	tenantId: string;
	customerId: string;
	segmentId: string;
	segmentIndex: number;
	prizeType: RoulettePrizeType;
	prizePayload: RouletteSegmentPrize;
	status?: RouletteSpinStatus;
	triggerSource: RouletteSpinTriggerSource;
	triggerRef?: string | null;
	idempotencyKey?: string | null;
	configSnapshot: RouletteConfigPrimitives;
};

export class RouletteSpin {
	private constructor(private readonly data: RouletteSpinPrimitives) {}

	static create(params: RouletteSpinCreateParams): RouletteSpin {
		return new RouletteSpin({
			id: randomUUID(),
			tenantId: params.tenantId,
			customerId: params.customerId,
			segmentId: params.segmentId,
			segmentIndex: params.segmentIndex,
			prizeType: params.prizeType,
			prizePayload: { ...params.prizePayload },
			status: params.status ?? "applied",
			triggerSource: params.triggerSource,
			triggerRef: params.triggerRef ?? null,
			idempotencyKey: params.idempotencyKey ?? null,
			configSnapshot: params.configSnapshot,
			createdAt: new Date().toISOString(),
			redeemedAt: null,
		});
	}

	static fromPrimitives(primitives: RouletteSpinPrimitives): RouletteSpin {
		return new RouletteSpin({
			...primitives,
			prizePayload: { ...primitives.prizePayload },
			configSnapshot: { ...primitives.configSnapshot },
		});
	}

	toPrimitives(): RouletteSpinPrimitives {
		return {
			...this.data,
			prizePayload: { ...this.data.prizePayload },
			configSnapshot: { ...this.data.configSnapshot },
		};
	}

	redeem(redeemedAt: Date = new Date()): RouletteSpin {
		if (this.data.prizeType !== "physical") {
			throw new RouletteSpinNotPendingRedeem("Only physical prizes require staff redemption");
		}

		if (this.data.status === "applied" && this.data.redeemedAt !== null) {
			throw new RouletteSpinAlreadyRedeemed(this.data.id);
		}

		if (this.data.status !== "pending_redeem") {
			throw new RouletteSpinNotPendingRedeem(
				`Roulette spin status must be pending_redeem (current: ${this.data.status})`,
			);
		}

		return new RouletteSpin({
			...this.data,
			status: "applied",
			redeemedAt: redeemedAt.toISOString(),
		});
	}

	segmentLabel(): string {
		const segment = this.data.configSnapshot.segments.find(
			(item) => item.id === this.data.segmentId,
		);

		return segment?.label ?? "Premio físico";
	}
}
