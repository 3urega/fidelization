import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionClaims = {
	userId: string;
	tenantId: string;
	role: string;
};

function getSecret(): Uint8Array {
	const secret = process.env.AUTH_SECRET;
	if (!secret || secret.length < 16) {
		throw new Error("AUTH_SECRET must be set (min 16 characters)");
	}

	return new TextEncoder().encode(secret);
}

export async function createSessionToken(claims: SessionClaims): Promise<string> {
	return new SignJWT({
		sub: claims.userId,
		tenantId: claims.tenantId,
		role: claims.role,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${MAX_AGE_SECONDS}s`)
		.sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
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

export function sessionCookieOptions(): {
	httpOnly: boolean;
	sameSite: "lax";
	secure: boolean;
	path: string;
	maxAge: number;
} {
	return {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: MAX_AGE_SECONDS,
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
	if (opts.secure) {
		parts.push("Secure");
	}

	return parts.join("; ");
}

export function clearSessionCookie(): string {
	return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=lax`;
}

async function getSessionTokenFromRequest(request: Request): Promise<string | null> {
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
	const token = await getSessionTokenFromRequest(request);

	if (!token) {
		return null;
	}

	return verifySessionToken(token);
}

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
	const session = await getAuthenticatedSession(request);

	return session?.userId ?? null;
}

export function jsonWithSessionCookie<T>(body: T, token: string, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Set-Cookie": buildSessionCookie(token),
		},
	});
}
