import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionCookieFromHeader, verifySessionTokenEdge } from "./lib/auth/middlewareSession";
import { attachResolvedTenantHeaders } from "./lib/tenant/attachResolvedTenantHeaders";
import { forwardResolvedTenantHeaders } from "./lib/tenant/forwardResolvedTenantHeaders";
import { resolveTenantFromRequest } from "./lib/tenant/resolveTenant";

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

async function getSession(request: NextRequest): Promise<boolean> {
	const token = getSessionCookieFromHeader(request.headers.get("cookie"));
	if (!token) {
		return false;
	}

	const session = await verifySessionTokenEdge(token);

	return session !== null;
}

function nextWithTenantContext(request: NextRequest, tenant: { slug: string; tenantId: string } | null): NextResponse {
	const headers = forwardResolvedTenantHeaders(request, tenant);

	return attachResolvedTenantHeaders(
		NextResponse.next({ request: { headers } }),
		tenant,
	);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const resolution = await resolveTenantFromRequest(request);

	const { pathname } = request.nextUrl;

	if (resolution.status === "not_found" && pathname !== "/tenant-not-found") {
		return NextResponse.rewrite(new URL("/tenant-not-found", request.url), { status: 404 });
	}

	const resolvedTenant = resolution.status === "resolved" ? resolution.tenant : null;

	if (pathname === "/home" || pathname === "/profile") {
		if (!(await getSession(request))) {
			return NextResponse.redirect(new URL("/login", request.url));
		}
	}

	if (pathname === "/login" || pathname === "/register" || pathname === "/") {
		if (await getSession(request)) {
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
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
