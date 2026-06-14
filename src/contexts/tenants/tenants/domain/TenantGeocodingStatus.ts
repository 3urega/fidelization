export type TenantGeocodingStatus = "ok" | "failed" | "skipped" | "cleared";

export const TENANT_GEOCODING_STATUS = {
	Ok: "ok",
	Failed: "failed",
	Skipped: "skipped",
	Cleared: "cleared",
} as const satisfies Record<string, TenantGeocodingStatus>;
