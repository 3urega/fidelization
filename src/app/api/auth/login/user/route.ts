import "reflect-metadata";

import { NextResponse } from "next/server";

import { LoginPlatformUser } from "../../../../../contexts/identity/users/application/authenticate/LoginPlatformUser";
import { InvalidCredentials } from "../../../../../contexts/identity/users/domain/InvalidCredentials";
import { PlatformUserCannotUseUserLogin } from "../../../../../contexts/identity/users/domain/PlatformUserCannotUseUserLogin";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, userAuthResponseToJson } from "../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../lib/auth/session";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

type Body = {
	email?: string;
	password?: string;
};

export async function POST(request: Request): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description: "Unified user login is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	try {
		const body = (await request.json()) as Body;

		if (!body.email || !body.password) {
			return NextResponse.json(
				{ error: { description: "email and password are required" } },
				{ status: 400 },
			);
		}

		const user = await container.get(LoginPlatformUser).login(body.email, body.password);
		const session = {
			kind: "user" as const,
			userId: user.id.value,
			...(user.qrValue ? { qrValue: user.qrValue } : {}),
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(userAuthResponseToJson(user, session), token);
	} catch (error) {
		if (
			error instanceof InvalidCredentials ||
			error instanceof PlatformUserCannotUseUserLogin
		) {
			const response = handleAuthDomainError(error);

			if (response) {
				return response;
			}
		}

		if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
			return NextResponse.json({ error: { description: error.message } }, { status: 500 });
		}

		console.error("[POST /api/auth/login/user]", error);

		return NextResponse.json(
			{ error: { description: "No se pudo iniciar sesión. Inténtalo de nuevo." } },
			{ status: 500 },
		);
	}
}
