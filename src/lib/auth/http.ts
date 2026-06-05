import { NextResponse } from "next/server";

import { DomainError } from "../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../contexts/shared/infrastructure/http/HttpNextResponse";
import { Tenant } from "../../contexts/tenants/tenants/domain/Tenant";
import { TenantSessionClaims } from "./session";

export function userToJson(user: {
	id: { value: string };
	name: { value: string };
	email: { value: string };
	profilePicture: { value: string };
	plan: string;
}): Record<string, string> {
	return {
		id: user.id.value,
		name: user.name.value,
		email: user.email.value,
		profilePicture: user.profilePicture.value,
		plan: user.plan,
	};
}

export function tenantToJson(tenant: Tenant): Record<string, string> {
	const primitives = tenant.toPrimitives();

	return {
		id: primitives.id,
		name: primitives.name,
		slug: primitives.slug,
		logoUrl: primitives.logoUrl,
		primaryColor: primitives.primaryColor,
		secondaryColor: primitives.secondaryColor,
		subscriptionPlan: primitives.subscriptionPlan,
		status: primitives.status,
	};
}

export function platformTenantToJson(tenant: Tenant): Record<string, string> {
	const primitives = tenant.toPrimitives();

	return {
		...tenantToJson(tenant),
		createdAt: primitives.createdAt,
	};
}

export function authResponseToJson(
	user: Parameters<typeof userToJson>[0],
	tenant: Tenant,
	session: TenantSessionClaims,
): Record<string, unknown> {
	return {
		user: userToJson(user),
		tenant: tenantToJson(tenant),
		role: session.role,
		kind: session.kind,
	};
}

export function platformAuthResponseToJson(
	user: Parameters<typeof userToJson>[0],
	session: { role: string; kind: string },
): Record<string, unknown> {
	return {
		user: userToJson(user),
		role: session.role,
		kind: session.kind,
	};
}

export function handleAuthDomainError(error: DomainError): NextResponse | undefined {
	if (error.type === "InvalidCredentials") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "EmailAlreadyRegistered") {
		return HttpNextResponse.domainError(error, 409);
	}
	if (error.type === "UserDoesNotExist") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "OwnerMembershipNotFound") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "StaffMembershipNotFound") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "CrossTenantAccessDenied") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidTenantSession") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "PlatformAccessDenied") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "PlatformUserCannotUseTenantLogin") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "TenantAccessSuspended") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "OwnerBusinessAlreadyExists") {
		return HttpNextResponse.domainError(error, 409);
	}
	if (error.type === "TenantBrandingForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidTenantBranding") {
		return HttpNextResponse.domainError(error, 400);
	}

	return undefined;
}
