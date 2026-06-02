export const SESSION_COOKIE_NAME = "session";

export type TenantSessionClaims = {
	kind: "tenant";
	userId: string;
	tenantId: string;
	role: string;
};

export type PlatformSessionClaims = {
	kind: "platform";
	userId: string;
	role: "superadmin";
};

export type SessionClaims = TenantSessionClaims | PlatformSessionClaims;

export function isTenantSession(session: SessionClaims): session is TenantSessionClaims {
	return session.kind === "tenant";
}

export function isPlatformSession(session: SessionClaims): session is PlatformSessionClaims {
	return session.kind === "platform";
}

export function parseSessionPayload(payload: Record<string, unknown>): SessionClaims | null {
	const userId = payload.sub;
	if (typeof userId !== "string") {
		return null;
	}

	if (payload.kind === "platform") {
		if (payload.role === "superadmin") {
			return { kind: "platform", userId, role: "superadmin" };
		}

		return null;
	}

	const tenantId = payload.tenantId;
	const role = payload.role;
	if (typeof tenantId === "string" && typeof role === "string") {
		return { kind: "tenant", userId, tenantId, role };
	}

	return null;
}
