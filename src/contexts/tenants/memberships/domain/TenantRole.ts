export enum TenantRole {
	Owner = "owner",
	Employee = "employee",
	Customer = "customer",
	Admin = "admin",
}

export const STAFF_TENANT_ROLES: TenantRole[] = [TenantRole.Owner, TenantRole.Employee, TenantRole.Admin];

export function isStaffRole(role: TenantRole): boolean {
	return STAFF_TENANT_ROLES.includes(role);
}
