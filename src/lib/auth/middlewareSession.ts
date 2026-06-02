import { jwtVerify } from "jose";

import { parseSessionPayload, SESSION_COOKIE_NAME, type SessionClaims } from "./sessionClaims";

/** Edge-safe: read AUTH_SECRET without throwing (middleware runs on Edge). */
function getSecret(): Uint8Array | null {
	const raw = process.env.AUTH_SECRET?.trim();
	if (!raw || raw.length < 16) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.warn("[middleware] AUTH_SECRET missing or too short — sessions will not verify");
		}

		return null;
	}

	return new TextEncoder().encode(raw);
}

export async function verifySessionTokenEdge(token: string): Promise<SessionClaims | null> {
	const secret = getSecret();
	if (!secret) {
		return null;
	}

	try {
		const { payload } = await jwtVerify(token, secret);

		return parseSessionPayload(payload as Record<string, unknown>);
	} catch {
		return null;
	}
}

export function getSessionCookieFromHeader(cookieHeader: string | null): string | null {
	if (!cookieHeader) {
		return null;
	}

	const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));

	return match?.[1] ?? null;
}
