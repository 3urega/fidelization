import { TenantStatus } from "./TenantStatus";

export type TenantPrimitives = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
	subscriptionPlan: string;
	status: TenantStatus;
	createdAt: string;
};

export class Tenant {
	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly slug: string,
		public readonly logoUrl: string,
		public readonly primaryColor: string,
		public readonly secondaryColor: string,
		public readonly subscriptionPlan: string,
		public readonly status: TenantStatus,
		public readonly createdAt: string,
	) {}

	static fromPrimitives(primitives: TenantPrimitives): Tenant {
		return new Tenant(
			primitives.id,
			primitives.name,
			primitives.slug,
			primitives.logoUrl,
			primitives.primaryColor,
			primitives.secondaryColor,
			primitives.subscriptionPlan,
			primitives.status,
			primitives.createdAt,
		);
	}

	toPrimitives(): TenantPrimitives {
		return {
			id: this.id,
			name: this.name,
			slug: this.slug,
			logoUrl: this.logoUrl,
			primaryColor: this.primaryColor,
			secondaryColor: this.secondaryColor,
			subscriptionPlan: this.subscriptionPlan,
			status: this.status,
			createdAt: this.createdAt,
		};
	}
}
