import { jwtVerify } from "jose";

import { env } from "../env";
import type { SessionClaims } from "./session";

const COOKIE_NAME = "session";

function getSecret(): Uint8Array | null {
	try {
		return new TextEncoder().encode(env.authSecret);
	} catch {
		return null;
	}
}

export async function verifySessionTokenEdge(token: string): Promise<SessionClaims | null> {
	const secret = getSecret();
	if (!secret) {
		return null;
	}

	try {
		const { payload } = await jwtVerify(token, secret);
		const userId = payload.sub;
		const tenantId = payload.tenantId;
		const role = payload.role;

		if (typeof userId !== "string" || typeof tenantId !== "string" || typeof role !== "string") {
			return null;
		}

		return { userId, tenantId, role };
	} catch {
		return null;
	}
}

export function getSessionCookieFromHeader(cookieHeader: string | null): string | null {
	if (!cookieHeader) {
		return null;
	}

	const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));

	return match?.[1] ?? null;
}
