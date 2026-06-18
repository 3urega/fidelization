import { hasTenantAddress } from "./hasTenantAddress";
import { hasTenantGeolocation } from "./hasTenantGeolocation";

export function hasTenantVerifiedLocation(tenant: {
	address?: string | null;
	latitude?: number | null;
	longitude?: number | null;
}): boolean {
	return hasTenantAddress(tenant) && hasTenantGeolocation(tenant);
}
