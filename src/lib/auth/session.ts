import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "../env";
import { parseSessionPayload, SESSION_COOKIE_NAME, type SessionClaims } from "./sessionClaims";

export {
	isCustomerSession,
	isOnboardingSession,
	isPlatformSession,
	isTenantSession,
	parseSessionPayload,
	type CustomerSessionClaims,
	type OnboardingSessionClaims,
	type PlatformSessionClaims,
	SESSION_COOKIE_NAME,
	type SessionClaims,
	type TenantSessionClaims,
} from "./sessionClaims";

const COOKIE_NAME = SESSION_COOKIE_NAME;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
	return new TextEncoder().encode(env.authSecret);
}

export async function createSessionToken(claims: SessionClaims): Promise<string> {
	const payload =
		claims.kind === "platform"
			? { kind: "platform" as const, sub: claims.userId, role: claims.role }
			: claims.kind === "onboarding"
				? { kind: "onboarding" as const, sub: claims.userId }
				: claims.kind === "customer"
					? {
							kind: "customer" as const,
							sub: claims.customerId,
							tenantId: claims.tenantId,
						}
					: {
							kind: "tenant" as const,
							sub: claims.userId,
							tenantId: claims.tenantId,
							role: claims.role,
						};

	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${MAX_AGE_SECONDS}s`)
		.sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());

		return parseSessionPayload(payload as Record<string, unknown>);
	} catch {
		return null;
	}
}

export function sessionCookieOptions(): {
	httpOnly: boolean;
	sameSite: "lax";
	secure: boolean;
	path: string;
	maxAge: number;
	domain?: string;
} {
	const domain = env.sessionCookieDomain;

	return {
		httpOnly: true,
		sameSite: "lax",
		secure: env.isProduction,
		path: "/",
		maxAge: MAX_AGE_SECONDS,
		...(domain ? { domain } : {}),
	};
}

export function buildSessionCookie(token: string): string {
	const opts = sessionCookieOptions();
	const parts = [
		`${COOKIE_NAME}=${token}`,
		"HttpOnly",
		`Path=${opts.path}`,
		`Max-Age=${opts.maxAge}`,
		`SameSite=${opts.sameSite}`,
	];
	if (opts.domain) {
		parts.push(`Domain=${opts.domain}`);
	}
	if (opts.secure) {
		parts.push("Secure");
	}

	return parts.join("; ");
}

export function clearSessionCookie(): string {
	const opts = sessionCookieOptions();
	const parts = [
		`${COOKIE_NAME}=`,
		"HttpOnly",
		`Path=${opts.path}`,
		"Max-Age=0",
		`SameSite=${opts.sameSite}`,
	];
	if (opts.domain) {
		parts.push(`Domain=${opts.domain}`);
	}
	if (opts.secure) {
		parts.push("Secure");
	}

	return parts.join("; ");
}

/** Preferred in App Router route handlers (reliable Set-Cookie). */
export function setSessionCookie(token: string): void {
	const opts = sessionCookieOptions();
	cookies().set(COOKIE_NAME, token, {
		httpOnly: opts.httpOnly,
		sameSite: opts.sameSite,
		secure: opts.secure,
		path: opts.path,
		maxAge: opts.maxAge,
		...(opts.domain ? { domain: opts.domain } : {}),
	});
}

export function deleteSessionCookie(): void {
	cookies().delete(COOKIE_NAME);
}

function getSessionTokenFromRequest(request: Request): string | null {
	const authHeader = request.headers.get("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.slice(7);
	}

	const cookieHeader = request.headers.get("cookie");
	if (!cookieHeader) {
		return null;
	}

	const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));

	return match?.[1] ?? null;
}

export async function getAuthenticatedSession(request: Request): Promise<SessionClaims | null> {
	const token = getSessionTokenFromRequest(request);

	if (!token) {
		return null;
	}

	return verifySessionToken(token);
}

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
	const session = await getAuthenticatedSession(request);

	if (!session || !("userId" in session)) {
		return null;
	}

	return session.userId;
}

export function jsonWithSessionCookie<T>(body: T, token: string, status = 200): NextResponse {
	const response = NextResponse.json(body, { status });
	response.headers.append("Set-Cookie", buildSessionCookie(token));

	return response;
}

/** Preferred in App Router route handlers (reliable cookie clear in the browser). */
export function jsonWithClearSessionCookie<T>(body: T, status = 200): NextResponse {
	const response = NextResponse.json(body, { status });
	response.headers.append("Set-Cookie", clearSessionCookie());
	deleteSessionCookie();

	return response;
}
