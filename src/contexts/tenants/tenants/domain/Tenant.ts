import { TenantStatus } from "./TenantStatus";
import type { TenantDiscoveryTagId } from "./TenantDiscoveryTag";
import type { GeocodingProviderId } from "../../../shared/geocoding/domain/GeocodingProvider";

export type TenantPrimitives = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
	subscriptionPlan: string;
	subscriptionPlanId: string | null;
	status: TenantStatus;
	createdAt: string;
	address?: string;
	description?: string;
	coverImageUrl?: string;
	discoveryTags?: TenantDiscoveryTagId[];
	latitude?: number | null;
	longitude?: number | null;
	geocodingProvider?: GeocodingProviderId | null;
	geocodedAt?: string | null;
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
		public readonly subscriptionPlanId: string | null,
		public readonly status: TenantStatus,
		public readonly createdAt: string,
		public readonly address: string,
		public readonly description: string,
		public readonly coverImageUrl: string,
		public readonly discoveryTags: TenantDiscoveryTagId[],
		public readonly latitude: number | null,
		public readonly longitude: number | null,
		public readonly geocodingProvider: GeocodingProviderId | null,
		public readonly geocodedAt: string | null,
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
			primitives.subscriptionPlanId,
			primitives.status,
			primitives.createdAt,
			primitives.address ?? "",
			primitives.description ?? "",
			primitives.coverImageUrl ?? "",
			primitives.discoveryTags ?? [],
			primitives.latitude ?? null,
			primitives.longitude ?? null,
			primitives.geocodingProvider ?? null,
			primitives.geocodedAt ?? null,
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
			subscriptionPlanId: this.subscriptionPlanId,
			status: this.status,
			createdAt: this.createdAt,
			address: this.address,
			description: this.description,
			coverImageUrl: this.coverImageUrl,
			discoveryTags: this.discoveryTags,
			latitude: this.latitude,
			longitude: this.longitude,
			geocodingProvider: this.geocodingProvider,
			geocodedAt: this.geocodedAt,
		};
	}
}
