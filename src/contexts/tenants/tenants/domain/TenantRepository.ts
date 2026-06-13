import type { TenantFeatureOverrides } from "../../../billing/subscriptions/domain/TenantFeatureOverrides";
import { DiscoverableEstablishmentsPage } from "./DiscoverableEstablishment";
import { Tenant } from "./Tenant";
import { TenantBrandingUpdate } from "./TenantBrandingUpdate";
import { TenantProfileUpdate } from "./TenantProfileUpdate";
import type { TenantPlatformProfileUpdate } from "./TenantPlatformProfileUpdate";
import { TenantStatus } from "./TenantStatus";
import type { TenantDiscoveryTagId } from "./TenantDiscoveryTag";
import type { DiscoverNearFilter } from "./DiscoverNearFilter";

export type ListDiscoverableEstablishmentsParams = {
	offset: number;
	limit: number;
	tags?: TenantDiscoveryTagId[];
	near?: DiscoverNearFilter;
};

export abstract class TenantRepository {
	abstract findAll(): Promise<Tenant[]>;

	async listDiscoverableActive(
		_params: ListDiscoverableEstablishmentsParams,
	): Promise<DiscoverableEstablishmentsPage> {
		return { establishments: [], hasMore: false };
	}

	abstract findById(tenantId: string): Promise<Tenant | null>;

	async findBySlug(_slug: string): Promise<Tenant | null> {
		return null;
	}

	abstract updateStatus(tenantId: string, status: TenantStatus): Promise<Tenant | null>;

	abstract updateBranding(tenantId: string, branding: TenantBrandingUpdate): Promise<Tenant | null>;

	async updatePlatformProfile(
		_tenantId: string,
		_profile: TenantPlatformProfileUpdate,
	): Promise<Tenant | null> {
		return null;
	}

	async updateProfile(_tenantId: string, _profile: TenantProfileUpdate): Promise<Tenant | null> {
		return null;
	}

	async updateCoverImageUrl(_tenantId: string, _coverImageUrl: string): Promise<Tenant | null> {
		return null;
	}

	async findFeatureOverrides(_tenantId: string): Promise<TenantFeatureOverrides | null> {
		return null;
	}

	async updateFeatureOverrides(
		_tenantId: string,
		_overrides: TenantFeatureOverrides | null,
	): Promise<void> {}
}
