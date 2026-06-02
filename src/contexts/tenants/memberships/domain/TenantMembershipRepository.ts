import { Tenant } from "../../tenants/domain/Tenant";
import { TenantRole } from "./TenantRole";

export type StaffMembership = {
	tenant: Tenant;
	role: TenantRole;
};

/** @deprecated Use StaffMembership */
export type OwnerMembership = StaffMembership;

export abstract class TenantMembershipRepository {
	abstract findStaffMembership(userId: string, tenantId: string): Promise<StaffMembership | null>;

	abstract findFirstStaffMembershipByUserId(userId: string): Promise<StaffMembership | null>;

	abstract findOwnerMembershipByUserId(userId: string): Promise<StaffMembership | null>;

	abstract findById(tenantId: string): Promise<Tenant | null>;
}
