import { Tenant } from "../../tenants/domain/Tenant";
import { TenantRole } from "./TenantRole";

export type OwnerMembership = {
	tenant: Tenant;
	role: TenantRole;
};

export abstract class TenantMembershipRepository {
	abstract findOwnerMembershipByUserId(userId: string): Promise<OwnerMembership | null>;

	abstract findById(tenantId: string): Promise<Tenant | null>;
}
