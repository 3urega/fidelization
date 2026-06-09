import { TenantRole } from "./TenantRole";

export type TenantEmployee = {
	membershipId: string;
	userId: string;
	name: string;
	email: string;
	role: TenantRole.Employee;
};

export type CreateStaffMembershipParams = {
	tenantId: string;
	userId: string;
	role: TenantRole;
};
