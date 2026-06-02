import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionCookieFromHeader, verifySessionTokenEdge } from "./lib/auth/middlewareSession";
import { attachResolvedTenantHeaders } from "./lib/tenant/attachResolvedTenantHeaders";
import { resolveTenantFromRequest } from "./lib/tenant/resolveTenant";

const allowedOrigins = new Set([
	"capacitor://localhost",
	"ionic://localhost",
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:3001",
	"http://127.0.0.1:3001",
]);

function corsHeaders(origin: string | null): HeadersInit {
	const allowOrigin = origin !== null && allowedOrigins.has(origin) ? origin : "*";

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

function nextWithTenantContext(request: NextRequest): NextResponse {
	const tenant = resolveTenantFromRequest(request);

	return attachResolvedTenantHeaders(
		NextResponse.next({ request: { headers: request.headers } }),
		tenant,
	);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const { pathname } = request.nextUrl;
	const resolvedTenant = resolveTenantFromRequest(request);

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
		return attachResolvedTenantHeaders(NextResponse.next(), resolvedTenant);
	}

	const origin = request.headers.get("origin");

	if (request.method === "OPTIONS") {
		return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
	}

	const response = nextWithTenantContext(request);
	const headers = corsHeaders(origin);

	Object.entries(headers).forEach(([key, value]) => {
		response.headers.set(key, String(value));
	});

	return response;
}

export const config = {
	matcher: ["/", "/home", "/profile", "/login", "/register", "/api/:path*"],
};
