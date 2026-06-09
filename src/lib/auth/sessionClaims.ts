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

export type OnboardingSessionClaims = {
	kind: "onboarding";
	userId: string;
};

export type CustomerSessionClaims = {
	kind: "customer";
	customerId: string;
	tenantId: string;
};

export type UserSessionClaims = {
	kind: "user";
	userId: string;
	qrValue?: string;
};

export type SessionClaims =
	| TenantSessionClaims
	| PlatformSessionClaims
	| OnboardingSessionClaims
	| CustomerSessionClaims
	| UserSessionClaims;

export function isTenantSession(session: SessionClaims): session is TenantSessionClaims {
	return session.kind === "tenant";
}

export function isPlatformSession(session: SessionClaims): session is PlatformSessionClaims {
	return session.kind === "platform";
}

export function isOnboardingSession(session: SessionClaims): session is OnboardingSessionClaims {
	return session.kind === "onboarding";
}

export function isCustomerSession(session: SessionClaims): session is CustomerSessionClaims {
	return session.kind === "customer";
}

export function isUserSession(session: SessionClaims): session is UserSessionClaims {
	return session.kind === "user";
}

export function parseSessionPayload(payload: Record<string, unknown>): SessionClaims | null {
	const subjectId = payload.sub;
	if (typeof subjectId !== "string") {
		return null;
	}

	if (payload.kind === "platform") {
		if (payload.role === "superadmin") {
			return { kind: "platform", userId: subjectId, role: "superadmin" };
		}

		return null;
	}

	if (payload.kind === "onboarding") {
		return { kind: "onboarding", userId: subjectId };
	}

	if (payload.kind === "customer") {
		const tenantId = payload.tenantId;
		if (typeof tenantId === "string") {
			return { kind: "customer", customerId: subjectId, tenantId };
		}

		return null;
	}

	if (payload.kind === "user") {
		const qrValue = payload.qrValue;

		return {
			kind: "user",
			userId: subjectId,
			...(typeof qrValue === "string" ? { qrValue } : {}),
		};
	}

	const tenantId = payload.tenantId;
	const role = payload.role;
	if (typeof tenantId === "string" && typeof role === "string") {
		return { kind: "tenant", userId: subjectId, tenantId, role };
	}

	return null;
}
