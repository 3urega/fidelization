export function hasTenantAddress(tenant: { address?: string | null }): boolean {
	return Boolean(tenant.address?.trim());
}
