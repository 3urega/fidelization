export enum TenantStatus {
	Active = "active",
	Suspended = "suspended",
}

export function parseTenantStatus(value: string): TenantStatus {
	if (value === TenantStatus.Active || value === TenantStatus.Suspended) {
		return value;
	}

	throw new Error(`Invalid tenant status: ${value}`);
}
