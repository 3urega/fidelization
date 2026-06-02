export enum PlatformRole {
	Superadmin = "superadmin",
}

export function isSuperadmin(role: PlatformRole | null | undefined): boolean {
	return role === PlatformRole.Superadmin;
}
