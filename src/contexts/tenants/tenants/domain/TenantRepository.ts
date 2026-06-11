import { DiscoverableEstablishmentsPage } from "./DiscoverableEstablishment";
import { Tenant } from "./Tenant";
import { TenantBrandingUpdate } from "./TenantBrandingUpdate";
import { TenantProfileUpdate } from "./TenantProfileUpdate";
import { TenantStatus } from "./TenantStatus";

export type ListDiscoverableEstablishmentsParams = {
	page: number;
	limit: number;
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

	async updateProfile(_tenantId: string, _profile: TenantProfileUpdate): Promise<Tenant | null> {
		return null;
	}
}
