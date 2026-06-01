import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
	const secret = process.env.AUTH_SECRET;
	if (!secret || secret.length < 16) {
		throw new Error("AUTH_SECRET must be set (min 16 characters)");
	}

	return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
	return new SignJWT({ sub: userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(`${MAX_AGE_SECONDS}s`)
		.sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		const sub = payload.sub;

		return typeof sub === "string" ? sub : null;
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

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
	const authHeader = request.headers.get("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return verifySessionToken(authHeader.slice(7));
	}

	const cookieHeader = request.headers.get("cookie");
	if (!cookieHeader) {
		return null;
	}

	const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
	if (!match) {
		return null;
	}

	return verifySessionToken(match[1]);
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
