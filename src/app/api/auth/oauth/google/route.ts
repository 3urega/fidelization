import "reflect-metadata";

import { NextResponse } from "next/server";

import { AuthenticateGoogleUser } from "../../../../../contexts/identity/users/application/authenticate/AuthenticateGoogleUser";
import { InvalidGoogleToken } from "../../../../../contexts/identity/users/domain/InvalidGoogleToken";
import { OAuthAccountAlreadyLinked } from "../../../../../contexts/identity/users/domain/OAuthAccountAlreadyLinked";
import { PlatformUserCannotUseUserLogin } from "../../../../../contexts/identity/users/domain/PlatformUserCannotUseUserLogin";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { env } from "../../../../../lib/env";
import { handleAuthDomainError, userAuthResponseToJson } from "../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../lib/auth/session";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

type Body = {
	idToken?: string;
};

export async function POST(request: Request): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Google sign-in is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	try {
		const body = (await request.json()) as Body;

		if (!body.idToken?.trim()) {
			return NextResponse.json({ error: { description: "idToken is required" } }, { status: 400 });
		}

		if (!env.googleClientId) {
			return NextResponse.json(
				{ error: { description: "Google sign-in is not configured (GOOGLE_CLIENT_ID)" } },
				{ status: 503 },
			);
		}

		const user = await container.get(AuthenticateGoogleUser).authenticate(body.idToken);
		const session = {
			kind: "user" as const,
			userId: user.id.value,
			...(user.qrValue ? { qrValue: user.qrValue } : {}),
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(userAuthResponseToJson(user, session), token);
	} catch (error) {
		if (
			error instanceof InvalidGoogleToken ||
			error instanceof OAuthAccountAlreadyLinked ||
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

		throw error;
	}
}
