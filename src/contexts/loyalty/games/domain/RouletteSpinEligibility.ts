import { randomUUID } from "crypto";

export type RouletteSpinEligibilityPrimitives = {
	id: string;
	tenantId: string;
	customerId: string;
	expiresAt: string;
	consumedAt: string | null;
	consumedSpinId: string | null;
	triggerRef: string | null;
	createdAt: string;
};

export type RouletteSpinEligibilityCreateParams = {
	tenantId: string;
	customerId: string;
	expiresAt: Date;
	triggerRef?: string | null;
};

export class RouletteSpinEligibility {
	private constructor(private readonly data: RouletteSpinEligibilityPrimitives) {}

	static create(params: RouletteSpinEligibilityCreateParams): RouletteSpinEligibility {
		return new RouletteSpinEligibility({
			id: randomUUID(),
			tenantId: params.tenantId,
			customerId: params.customerId,
			expiresAt: params.expiresAt.toISOString(),
			consumedAt: null,
			consumedSpinId: null,
			triggerRef: params.triggerRef ?? null,
			createdAt: new Date().toISOString(),
		});
	}

	static fromPrimitives(data: RouletteSpinEligibilityPrimitives): RouletteSpinEligibility {
		return new RouletteSpinEligibility(data);
	}

	toPrimitives(): RouletteSpinEligibilityPrimitives {
		return { ...this.data };
	}

	isActive(at: Date = new Date()): boolean {
		if (this.data.consumedAt !== null) {
			return false;
		}

		return new Date(this.data.expiresAt).getTime() > at.getTime();
	}

	withRenewedExpiry(expiresAt: Date, triggerRef?: string | null): RouletteSpinEligibility {
		return new RouletteSpinEligibility({
			...this.data,
			expiresAt: expiresAt.toISOString(),
			triggerRef: triggerRef ?? this.data.triggerRef,
			createdAt: new Date().toISOString(),
		});
	}

	consume(spinId: string, at: Date = new Date()): RouletteSpinEligibility {
		return new RouletteSpinEligibility({
			...this.data,
			consumedAt: at.toISOString(),
			consumedSpinId: spinId,
		});
	}
}
