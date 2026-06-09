import { Tenant } from "../../tenants/domain/Tenant";
import { CreateStaffMembershipParams, TenantEmployee } from "./TenantEmployee";
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

	abstract createStaffMembership(
		params: CreateStaffMembershipParams,
	): Promise<{ membershipId: string }>;

	abstract listEmployeesByTenant(tenantId: string): Promise<TenantEmployee[]>;
}
