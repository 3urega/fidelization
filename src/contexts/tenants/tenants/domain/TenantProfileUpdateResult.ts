import type { Tenant } from "./Tenant";
import type { TenantGeocodingStatus } from "./TenantGeocodingStatus";

export type TenantProfileUpdateResult = {
	tenant: Tenant;
	geocodingStatus: TenantGeocodingStatus;
	geocodingMessage?: string;
};
