import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionCookieFromHeader, verifySessionTokenEdge } from "./lib/auth/middlewareSession";
import { isOnboardingSession, isPlatformSession, isTenantSession } from "./lib/auth/sessionClaims";
import { attachResolvedTenantHeaders } from "./lib/tenant/attachResolvedTenantHeaders";
import { forwardResolvedTenantHeaders } from "./lib/tenant/forwardResolvedTenantHeaders";
import { getAppDomain, resolveTenantFromRequest } from "./lib/tenant/resolveTenant";

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

function isRegisterPath(pathname: string): boolean {
	return pathname === "/register" || pathname.startsWith("/register/");
}

function isAuthPublicPath(pathname: string): boolean {
	return pathname === "/login" || isRegisterPath(pathname) || pathname === "/";
}

function isTenantAppPath(pathname: string): boolean {
	return pathname === "/home" || pathname === "/profile" || pathname.startsWith("/settings/");
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const resolution = await resolveTenantFromRequest(request);

	const { pathname } = request.nextUrl;
	const resolvedTenant = resolution.status === "resolved" ? resolution.tenant : null;
	const session = await getSession(request);
	const hasPlatformSession = session !== null && isPlatformSession(session);
	const hasTenantSession = session !== null && isTenantSession(session);
	const hasOnboardingSession = session !== null && isOnboardingSession(session);

	if (resolution.status === "not_found" && pathname !== "/tenant-not-found") {
		return NextResponse.rewrite(new URL("/tenant-not-found", request.url), { status: 404 });
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
	} else if (hasPlatformSession && (pathname === "/login" || isRegisterPath(pathname))) {
		return NextResponse.redirect(new URL("/platform", request.url));
	} else if (hasOnboardingSession && isPlatformPath(pathname)) {
		return NextResponse.redirect(new URL("/register/business/tenant", request.url));
	}

	if (pathname === "/register/business/tenant") {
		if (hasTenantSession) {
			return NextResponse.redirect(new URL("/home", request.url));
		}
		if (!hasOnboardingSession) {
			return NextResponse.redirect(new URL("/register/business", request.url));
		}
	} else if (pathname === "/register/business" && hasOnboardingSession) {
		return NextResponse.redirect(new URL("/register/business/tenant", request.url));
	}

	if (isTenantAppPath(pathname)) {
		if (hasOnboardingSession) {
			return NextResponse.redirect(new URL("/register/business/tenant", request.url));
		}
		if (!hasTenantSession) {
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	if (isAuthPublicPath(pathname)) {
		if (hasTenantSession) {
			return NextResponse.redirect(new URL("/home", request.url));
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
