import { Tenant } from "./Tenant";
import { TenantStatus } from "./TenantStatus";

export abstract class TenantRepository {
	abstract findAll(): Promise<Tenant[]>;

	abstract findById(tenantId: string): Promise<Tenant | null>;

	abstract updateStatus(tenantId: string, status: TenantStatus): Promise<Tenant | null>;
}
