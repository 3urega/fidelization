/** Canonical paths for the unified platform app (apex). Tenant owner panel stays at `/home`. */

export const platformRoutes = {
	publicHome: "/",
	login: "/login",
	register: "/register",
	dashboard: "/dashboard",
	dashboardDiscover: "/dashboard/discover",
	dashboardQr: "/dashboard/qr",
	dashboardBusiness: (slug: string) => `/dashboard/business/${encodeURIComponent(slug)}`,
	dashboardEstablishment: (slug: string) =>
		`/dashboard/establishments/${encodeURIComponent(slug)}`,
	join: (slug: string) => `/join/${encodeURIComponent(slug)}`,
	registerBusiness: "/business/register",
	registerBusinessTenant: "/business/register/tenant",
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
		return platformRoutes.dashboard;
	}

	if (pathname.startsWith("/u/home/")) {
		return pathname.replace("/u/home", platformRoutes.dashboard);
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
		pathname === platformRoutes.dashboard ||
		pathname.startsWith(`${platformRoutes.dashboard}/`) ||
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
