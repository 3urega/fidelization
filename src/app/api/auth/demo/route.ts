import "reflect-metadata";

import { NextResponse } from "next/server";

import { UserAuthenticator } from "../../../../contexts/identity/users/application/authenticate/UserAuthenticator";
import { InvalidCredentials } from "../../../../contexts/identity/users/domain/InvalidCredentials";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, userToJson } from "../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../lib/auth/session";

export async function POST(): Promise<Response> {
	try {
		const authenticator = container.get(UserAuthenticator);
		const user = await authenticator.loginDemo();
		const token = await createSessionToken(user.id.value);

		return jsonWithSessionCookie({ user: userToJson(user) }, token);
	} catch (error) {
		if (error instanceof InvalidCredentials) {
			const response = handleAuthDomainError(error);

			if (response) {
				return response;
			}
		}

		if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
			return NextResponse.json({ error: { description: error.message } }, { status: 500 });
		}

		throw error;
	}
}
