import "reflect-metadata";

import { NextResponse } from "next/server";

import { UserRegistrar } from "../../../../contexts/identity/users/application/register/UserRegistrar";
import { EmailAlreadyRegistered } from "../../../../contexts/identity/users/domain/EmailAlreadyRegistered";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, userToJson } from "../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../lib/auth/session";

type Body = {
	name: string;
	email: string;
	password: string;
	profilePicture?: string;
};

export async function POST(request: Request): Promise<Response> {
	try {
		const body = (await request.json()) as Body;
		if (!body.name || !body.email || !body.password) {
			return NextResponse.json(
				{ error: { description: "name, email and password are required" } },
				{ status: 400 },
			);
		}

		const registrar = container.get(UserRegistrar);
		const user = await registrar.register({
			name: body.name,
			email: body.email,
			password: body.password,
			profilePicture: body.profilePicture,
		});

		const token = await createSessionToken(user.id.value);

		return jsonWithSessionCookie({ user: userToJson(user) }, token, 201);
	} catch (error) {
		if (error instanceof EmailAlreadyRegistered) {
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
