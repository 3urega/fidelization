export function hasTenantDiscoveryTags(tenant: { discoveryTags?: string[] | null }): boolean {
	return (tenant.discoveryTags ?? []).length > 0;
}
