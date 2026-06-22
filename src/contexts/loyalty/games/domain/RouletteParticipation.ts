import { randomUUID } from "crypto";

export const ROULETTE_PARTICIPATION_STATUSES = ["active", "quota_exhausted", "period_expired"] as const;
export type RouletteParticipationStatus = (typeof ROULETTE_PARTICIPATION_STATUSES)[number];

export type RouletteParticipationViewStatus =
	| "not_enrolled"
	| RouletteParticipationStatus;

export type RouletteParticipationPrimitives = {
	id: string;
	tenantId: string;
	customerId: string;
	enrolledAt: string;
	periodEndsAt: string;
	status: RouletteParticipationStatus;
	createdAt: string;
	updatedAt: string;
};

export type RouletteParticipationEnrollParams = {
	tenantId: string;
	customerId: string;
	enrolledAt: Date;
	periodEndsAt: Date;
};

export class RouletteParticipation {
	private constructor(private readonly data: RouletteParticipationPrimitives) {}

	static enroll(params: RouletteParticipationEnrollParams): RouletteParticipation {
		const now = new Date().toISOString();

		return new RouletteParticipation({
			id: randomUUID(),
			tenantId: params.tenantId,
			customerId: params.customerId,
			enrolledAt: params.enrolledAt.toISOString(),
			periodEndsAt: params.periodEndsAt.toISOString(),
			status: "active",
			createdAt: now,
			updatedAt: now,
		});
	}

	static fromPrimitives(data: RouletteParticipationPrimitives): RouletteParticipation {
		return new RouletteParticipation(data);
	}

	toPrimitives(): RouletteParticipationPrimitives {
		return { ...this.data };
	}

	isPeriodActive(at: Date = new Date()): boolean {
		return at.getTime() < new Date(this.data.periodEndsAt).getTime();
	}

	withStatus(status: RouletteParticipationStatus): RouletteParticipation {
		return new RouletteParticipation({
			...this.data,
			status,
			updatedAt: new Date().toISOString(),
		});
	}

	renew(params: { enrolledAt: Date; periodEndsAt: Date }): RouletteParticipation {
		return new RouletteParticipation({
			...this.data,
			enrolledAt: params.enrolledAt.toISOString(),
			periodEndsAt: params.periodEndsAt.toISOString(),
			status: "active",
			updatedAt: new Date().toISOString(),
		});
	}
}
