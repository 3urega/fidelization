/** Canonical paths for the unified platform app (apex). Tenant owner panel at `/panel`. */

export type PlatformHomeTab = "explore" | "locales" | "negocios";

export type PlatformProfileTab = "personal" | "tarjetas";

export function parsePlatformHomeTab(value: string | null | undefined): PlatformHomeTab {
	if (value === "locales" || value === "negocios") {
		return value;
	}

	return "explore";
}

export function parsePlatformProfileTab(value: string | null | undefined): PlatformProfileTab {
	if (value === "tarjetas") {
		return "tarjetas";
	}

	return "personal";
}

export const platformRoutes = {
	publicHome: "/",
	login: "/login",
	register: "/register",
	home: "/home",
	homeTab: (tab: PlatformHomeTab): string =>
		tab === "explore" ? "/home" : `/home?tab=${tab}`,
	homeProfile: (tab: PlatformProfileTab = "personal"): string =>
		tab === "personal" ? "/home/profile" : `/home/profile?tab=${tab}`,
	/** @deprecated Use `homeMap` — zone editing moved to `/home/map` (Phase U4 #106). */
	homeProfileSearchZone: (): string => platformRoutes.homeMap,
	homeMap: "/home/map",
	homeDiscover: "/home/discover",
	homeQr: "/home/qr",
	homeBusiness: (slug: string) => `/home/business/${encodeURIComponent(slug)}`,
	homeEstablishment: (slug: string) => `/home/establishments/${encodeURIComponent(slug)}`,
	join: (slug: string) => `/join/${encodeURIComponent(slug)}`,
	registerBusiness: "/business/register",
	registerBusinessTenant: "/business/register/tenant",
	tenantPanel: "/panel",
} as const;

const LEGACY_PREFIX = "/u";

/** Map legacy `/u/*` paths to canonical platform routes (308 redirects). */
export function mapLegacyPlatformPath(pathname: string): string | null {
	if (pathname === "/u" || pathname === "/u/") {
		return platformRoutes.publicHome;
	}

	if (pathname === "/u/login") {
		return platformRoutes.login;
	}

	if (pathname === "/u/register") {
		return platformRoutes.register;
	}

	if (pathname === "/u/home") {
		return platformRoutes.home;
	}

	if (pathname.startsWith("/u/home/")) {
		return pathname.replace("/u/home", platformRoutes.home);
	}

	if (pathname.startsWith("/u/join/")) {
		return pathname.replace("/u/join", "/join");
	}

	if (pathname === "/u/register/business") {
		return platformRoutes.registerBusiness;
	}

	if (pathname === "/u/register/business/tenant") {
		return platformRoutes.registerBusinessTenant;
	}

	if (pathname.startsWith(`${LEGACY_PREFIX}/`)) {
		return pathname.slice(LEGACY_PREFIX.length) || platformRoutes.publicHome;
	}

	return null;
}

export function isPlatformAppPublicPath(pathname: string): boolean {
	return (
		pathname === platformRoutes.publicHome ||
		pathname === platformRoutes.login ||
		pathname === platformRoutes.register
	);
}

export function isPlatformAppProtectedPath(pathname: string): boolean {
	return (
		pathname === platformRoutes.home ||
		pathname.startsWith(`${platformRoutes.home}/`) ||
		pathname.startsWith("/join/")
	);
}

export function isPlatformAppAuthEntryPath(pathname: string): boolean {
	return isPlatformAppPublicPath(pathname);
}

export function isPlatformAppBusinessRegisterPath(pathname: string): boolean {
	return (
		pathname === platformRoutes.registerBusiness ||
		pathname.startsWith(`${platformRoutes.registerBusiness}/`)
	);
}
