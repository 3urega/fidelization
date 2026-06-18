export function hasTenantGeolocation(tenant: {
	latitude?: number | null;
	longitude?: number | null;
}): boolean {
	return tenant.latitude != null && tenant.longitude != null;
}
