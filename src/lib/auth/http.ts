import { NextResponse } from "next/server";

import { DomainError } from "../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../contexts/shared/infrastructure/http/HttpNextResponse";
import { Tenant } from "../../contexts/tenants/tenants/domain/Tenant";
import { SessionClaims } from "./session";

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
	};
}

export function authResponseToJson(
	user: Parameters<typeof userToJson>[0],
	tenant: Tenant,
	session: SessionClaims,
): Record<string, unknown> {
	return {
		user: userToJson(user),
		tenant: tenantToJson(tenant),
		role: session.role,
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

	return undefined;
}
