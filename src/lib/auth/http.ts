import { NextResponse } from "next/server";

import { DomainError } from "../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../contexts/shared/infrastructure/http/HttpNextResponse";

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

	return undefined;
}
