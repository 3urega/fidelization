import { randomUUID } from "crypto";

export const GENERIC_STAMP_VISIT_LABEL = "Visita general";

export type StampTypePrimitives = {
	id: string;
	tenantId: string;
	label: string;
	slug: string;
	sortOrder: number;
	isActive: boolean;
};

export type StampTypeCreateParams = {
	tenantId: string;
	label: string;
	slug: string;
	sortOrder: number;
};

export class StampType {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly label: string,
		public readonly slug: string,
		public readonly sortOrder: number,
		public readonly isActive: boolean,
	) {}

	static create(params: StampTypeCreateParams): StampType {
		return new StampType(
			randomUUID(),
			params.tenantId,
			params.label,
			params.slug,
			params.sortOrder,
			true,
		);
	}

	static fromPrimitives(primitives: StampTypePrimitives): StampType {
		return new StampType(
			primitives.id,
			primitives.tenantId,
			primitives.label,
			primitives.slug,
			primitives.sortOrder,
			primitives.isActive,
		);
	}

	toPrimitives(): StampTypePrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			label: this.label,
			slug: this.slug,
			sortOrder: this.sortOrder,
			isActive: this.isActive,
		};
	}

	deactivate(): StampType {
		if (!this.isActive) {
			return this;
		}

		return new StampType(
			this.id,
			this.tenantId,
			this.label,
			this.slug,
			this.sortOrder,
			false,
		);
	}
}
