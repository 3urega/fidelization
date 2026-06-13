import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionCookieFromHeader, verifySessionTokenEdge } from "./lib/auth/middlewareSession";
import {
	isCustomerSession,
	isOnboardingSession,
	isPlatformSession,
	isTenantSession,
	isUserSession,
} from "./lib/auth/sessionClaims";
import {
	isPlatformAppAuthEntryPath,
	isPlatformAppBusinessRegisterPath,
	isPlatformAppProtectedPath,
	mapLegacyPlatformPath,
	platformRoutes,
} from "./lib/platform/routes";
import { attachResolvedTenantHeaders } from "./lib/tenant/attachResolvedTenantHeaders";
import { forwardResolvedTenantHeaders } from "./lib/tenant/forwardResolvedTenantHeaders";
import { getAppDomain, resolveTenantFromRequest } from "./lib/tenant/resolveTenant";
import { safeRedirectPath } from "./lib/auth/safeRedirectPath";

const allowedOrigins = new Set([
	"capacitor://localhost",
	"ionic://localhost",
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:3001",
	"http://127.0.0.1:3001",
]);

function isAllowedCorsOrigin(origin: string): boolean {
	if (allowedOrigins.has(origin)) {
		return true;
	}

	try {
		const { hostname, protocol } = new URL(origin);

		return (
			protocol === "http:" &&
			(hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1")
		);
	} catch {
		return false;
	}
}

function corsHeaders(origin: string | null): HeadersInit {
	const allowOrigin = origin !== null && isAllowedCorsOrigin(origin) ? origin : "*";

	return {
		"Access-Control-Allow-Origin": allowOrigin,
		"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Max-Age": "86400",
	};
}

async function getSession(request: NextRequest) {
	const token = getSessionCookieFromHeader(request.headers.get("cookie"));
	if (!token) {
		return null;
	}

	return verifySessionTokenEdge(token);
}

function nextWithTenantContext(
	request: NextRequest,
	tenant: { slug: string; tenantId: string } | null,
): NextResponse {
	const headers = forwardResolvedTenantHeaders(request, tenant);

	return attachResolvedTenantHeaders(NextResponse.next({ request: { headers } }), tenant);
}

function isPlatformPath(pathname: string): boolean {
	return pathname === "/platform" || pathname.startsWith("/platform/");
}

function isLegacyBusinessRegisterPath(pathname: string): boolean {
	return pathname === "/register/business" || pathname.startsWith("/register/business/");
}

function isAuthPublicPath(pathname: string): boolean {
	return pathname === "/login" || pathname === platformRoutes.register || pathname === platformRoutes.publicHome;
}

function isTenantAppPath(pathname: string): boolean {
	return (
		pathname === platformRoutes.tenantPanel ||
		pathname === "/profile" ||
		pathname === "/scan" ||
		pathname === "/customers" ||
		pathname.startsWith("/customers/") ||
		pathname.startsWith("/onboarding/") ||
		pathname.startsWith("/settings/")
	);
}

function isCustomerAppPath(pathname: string): boolean {
	return pathname === "/app" || pathname.startsWith("/app/");
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const resolution = await resolveTenantFromRequest(request);

	const { pathname } = request.nextUrl;
	const resolvedTenant = resolution.status === "resolved" ? resolution.tenant : null;
	const session = await getSession(request);
	const hasPlatformSession = session !== null && isPlatformSession(session);
	const hasTenantSession = session !== null && isTenantSession(session);
	const hasOnboardingSession = session !== null && isOnboardingSession(session);
	const hasCustomerSession = session !== null && isCustomerSession(session);
	const hasUserSession = session !== null && isUserSession(session);

	const legacyTarget = mapLegacyPlatformPath(pathname);
	if (legacyTarget) {
		return NextResponse.redirect(new URL(legacyTarget, request.url), 308);
	}

	if (resolution.status === "not_found" && pathname !== "/tenant-not-found") {
		return NextResponse.rewrite(new URL("/tenant-not-found", request.url), { status: 404 });
	}

	if (pathname === platformRoutes.publicHome) {
		if (hasUserSession) {
			return NextResponse.redirect(new URL(platformRoutes.home, request.url));
		}
		if (hasTenantSession && !resolvedTenant) {
			return NextResponse.redirect(new URL(platformRoutes.tenantPanel, request.url));
		}
	}

	if (resolvedTenant && isPlatformPath(pathname)) {
		const appDomain = getAppDomain();
		if (appDomain) {
			const apex = new URL(request.url);
			apex.hostname = appDomain;
			if (pathname !== "/platform/login") {
				apex.pathname = "/platform/login";
			}

			return NextResponse.redirect(apex);
		}

		return NextResponse.redirect(new URL("/login", request.url));
	}

	if (isPlatformPath(pathname)) {
		if (pathname === "/platform/login") {
			if (hasPlatformSession) {
				return NextResponse.redirect(new URL("/platform", request.url));
			}
		} else if (!hasPlatformSession) {
			return NextResponse.redirect(new URL("/platform/login", request.url));
		}
	} else if (hasPlatformSession && isTenantAppPath(pathname)) {
		return NextResponse.redirect(new URL("/platform", request.url));
	} else if (hasPlatformSession && (pathname === "/login" || pathname === platformRoutes.register)) {
		return NextResponse.redirect(new URL("/platform", request.url));
	} else if (hasPlatformSession && isPlatformAppAuthEntryPath(pathname)) {
		return NextResponse.redirect(new URL("/platform", request.url));
	} else if (hasPlatformSession && isPlatformAppProtectedPath(pathname)) {
		return NextResponse.redirect(new URL("/platform", request.url));
	} else if (hasPlatformSession && isPlatformAppBusinessRegisterPath(pathname)) {
		return NextResponse.redirect(new URL("/platform", request.url));
	} else if (hasOnboardingSession && isPlatformPath(pathname)) {
		return NextResponse.redirect(new URL("/register/business/tenant", request.url));
	}

	if (pathname === "/register/business/tenant") {
		if (hasTenantSession) {
			return NextResponse.redirect(new URL(platformRoutes.tenantPanel, request.url));
		}
		if (!hasOnboardingSession) {
			return NextResponse.redirect(new URL("/register/business", request.url));
		}
	} else if (pathname === "/register/business" && hasOnboardingSession) {
		return NextResponse.redirect(new URL("/register/business/tenant", request.url));
	}

	if (isCustomerAppPath(pathname)) {
		if (resolution.status === "inactive" && pathname !== "/app/unavailable") {
			return NextResponse.redirect(new URL("/app/unavailable", request.url));
		}

		if (hasPlatformSession) {
			return NextResponse.redirect(new URL("/platform", request.url));
		}

		if (hasTenantSession) {
			return NextResponse.redirect(new URL(platformRoutes.tenantPanel, request.url));
		}

		if (hasOnboardingSession) {
			return NextResponse.redirect(new URL("/register/business/tenant", request.url));
		}

		if (pathname === "/app/card" && !hasCustomerSession) {
			return NextResponse.redirect(new URL("/app/welcome", request.url));
		}

		if ((pathname === "/app" || pathname === "/app/welcome") && hasCustomerSession) {
			return NextResponse.redirect(new URL("/app/card", request.url));
		}

		if (pathname === "/app") {
			return NextResponse.redirect(
				new URL(hasCustomerSession ? "/app/card" : "/app/welcome", request.url),
			);
		}
	}

	if (isPlatformAppProtectedPath(pathname)) {
		if (hasOnboardingSession) {
			return NextResponse.redirect(new URL("/register/business/tenant", request.url));
		}
		if (hasTenantSession) {
			return NextResponse.redirect(new URL(platformRoutes.tenantPanel, request.url));
		}
		if (hasCustomerSession) {
			return NextResponse.redirect(new URL("/app/card", request.url));
		}
		if (!hasUserSession) {
			const login = new URL(platformRoutes.login, request.url);
			login.searchParams.set("next", pathname);

			return NextResponse.redirect(login);
		}
	} else if (pathname === platformRoutes.registerBusiness && hasUserSession) {
		return NextResponse.redirect(new URL(platformRoutes.registerBusinessTenant, request.url));
	} else if (pathname === platformRoutes.registerBusinessTenant) {
		if (hasOnboardingSession) {
			return NextResponse.redirect(new URL("/register/business/tenant", request.url));
		}
		if (hasTenantSession) {
			return NextResponse.redirect(new URL(platformRoutes.tenantPanel, request.url));
		}
		if (hasCustomerSession) {
			return NextResponse.redirect(new URL("/app/card", request.url));
		}
		if (!hasUserSession) {
			return NextResponse.redirect(new URL(platformRoutes.registerBusiness, request.url));
		}
	} else if (isPlatformAppAuthEntryPath(pathname) && hasUserSession) {
		const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
		if (next) {
			return NextResponse.redirect(new URL(next, request.url));
		}

		return NextResponse.redirect(new URL(platformRoutes.home, request.url));
	}

	if (isTenantAppPath(pathname)) {
		if (hasOnboardingSession) {
			return NextResponse.redirect(new URL("/register/business/tenant", request.url));
		}
		if (hasUserSession && !hasTenantSession) {
			return NextResponse.redirect(new URL(platformRoutes.home, request.url));
		}
		if (!hasTenantSession) {
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	if (isAuthPublicPath(pathname)) {
		if (hasUserSession) {
			const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
			if (next) {
				return NextResponse.redirect(new URL(next, request.url));
			}

			return NextResponse.redirect(new URL(platformRoutes.home, request.url));
		}
		if (hasTenantSession) {
			return NextResponse.redirect(new URL(platformRoutes.tenantPanel, request.url));
		}
	}

	if (!pathname.startsWith("/api/")) {
		return nextWithTenantContext(request, resolvedTenant);
	}

	const origin = request.headers.get("origin");

	if (request.method === "OPTIONS") {
		return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
	}

	const response = nextWithTenantContext(request, resolvedTenant);
	const headers = corsHeaders(origin);

	Object.entries(headers).forEach(([key, value]) => {
		response.headers.set(key, String(value));
	});

	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
};
