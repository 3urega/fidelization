import { Tenant } from "../../tenants/domain/Tenant";
import { CreateStaffMembershipParams, TenantEmployee } from "./TenantEmployee";
import { TenantRole } from "./TenantRole";

export type StaffMembership = {
	tenant: Tenant;
	role: TenantRole;
};

export type OwnerStaffMembership = StaffMembership & {
	userId: string;
};

/** @deprecated Use StaffMembership */
export type OwnerMembership = StaffMembership;

export abstract class TenantMembershipRepository {
	abstract findStaffMembership(userId: string, tenantId: string): Promise<StaffMembership | null>;

	abstract findFirstStaffMembershipByUserId(userId: string): Promise<StaffMembership | null>;

	abstract findOwnerMembershipByUserId(userId: string): Promise<StaffMembership | null>;

	abstract listOwnerMembershipsByUserId(userId: string): Promise<StaffMembership[]>;

	async findFirstOwnerMembershipByTenantId(_tenantId: string): Promise<OwnerStaffMembership | null> {
		return null;
	}

	abstract findById(tenantId: string): Promise<Tenant | null>;

	abstract createStaffMembership(
		params: CreateStaffMembershipParams,
	): Promise<{ membershipId: string }>;

	abstract listEmployeesByTenant(tenantId: string): Promise<TenantEmployee[]>;
}
