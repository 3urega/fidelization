import type { PlatformTenantDetail } from "./PlatformTenantDetail";

export abstract class PlatformTenantDetailReadRepository {
	abstract getById(tenantId: string): Promise<PlatformTenantDetail | null>;
}
