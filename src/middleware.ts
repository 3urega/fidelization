import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionCookieFromHeader, verifySessionTokenEdge } from "./lib/auth/middlewareSession";

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

export async function middleware(request: NextRequest): Promise<NextResponse> {
	const { pathname } = request.nextUrl;

	if (pathname === "/home") {
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
		return NextResponse.next();
	}

	const origin = request.headers.get("origin");

	if (request.method === "OPTIONS") {
		return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
	}

	const response = NextResponse.next({ request: { headers: request.headers } });
	const headers = corsHeaders(origin);

	Object.entries(headers).forEach(([key, value]) => {
		response.headers.set(key, String(value));
	});

	return response;
}

export const config = {
	matcher: ["/", "/home", "/login", "/register", "/api/:path*"],
};
