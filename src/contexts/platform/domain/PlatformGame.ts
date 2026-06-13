import { randomUUID } from "crypto";

import type { TenantPlanFeature } from "../../billing/subscriptions/domain/TenantPlanFeature";
import type { PlatformGameStatus } from "./PlatformGameStatus";

export type PlatformGamePrimitives = {
	id: string;
	slug: string;
	label: string;
	description: string;
	status: PlatformGameStatus;
	requiredFeature: TenantPlanFeature;
	sortOrder: number;
};

export type PlatformGameCreateParams = {
	slug: string;
	label: string;
	description: string;
	status: PlatformGameStatus;
	requiredFeature: TenantPlanFeature;
	sortOrder: number;
};

export class PlatformGame {
	private constructor(
		public readonly id: string,
		public readonly slug: string,
		public readonly label: string,
		public readonly description: string,
		public readonly status: PlatformGameStatus,
		public readonly requiredFeature: TenantPlanFeature,
		public readonly sortOrder: number,
	) {}

	static create(params: PlatformGameCreateParams): PlatformGame {
		return new PlatformGame(
			randomUUID(),
			params.slug,
			params.label,
			params.description,
			params.status,
			params.requiredFeature,
			params.sortOrder,
		);
	}

	static fromPrimitives(primitives: PlatformGamePrimitives): PlatformGame {
		return new PlatformGame(
			primitives.id,
			primitives.slug,
			primitives.label,
			primitives.description,
			primitives.status,
			primitives.requiredFeature,
			primitives.sortOrder,
		);
	}

	toPrimitives(): PlatformGamePrimitives {
		return {
			id: this.id,
			slug: this.slug,
			label: this.label,
			description: this.description,
			status: this.status,
			requiredFeature: this.requiredFeature,
			sortOrder: this.sortOrder,
		};
	}

	update(params: {
		label: string;
		description: string;
		status: PlatformGameStatus;
		requiredFeature: TenantPlanFeature;
		sortOrder: number;
	}): PlatformGame {
		return new PlatformGame(
			this.id,
			this.slug,
			params.label,
			params.description,
			params.status,
			params.requiredFeature,
			params.sortOrder,
		);
	}
}
