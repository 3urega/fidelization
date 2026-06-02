import "reflect-metadata";

import { NextResponse } from "next/server";

import { InvalidCredentials } from "../../../../../contexts/identity/users/domain/InvalidCredentials";
import { PlatformAuthenticator } from "../../../../../contexts/platform/application/authenticate/PlatformAuthenticator";
import { PlatformAccessDenied } from "../../../../../contexts/platform/domain/PlatformAccessDenied";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, platformAuthResponseToJson } from "../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../lib/auth/session";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

type Body = {
	email: string;
	password: string;
};

export async function POST(request: Request): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description: "Platform login is only available on the apex host (no business subdomain).",
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

		const user = await container.get(PlatformAuthenticator).login(body.email, body.password);
		const session = {
			kind: "platform" as const,
			userId: user.id.value,
			role: "superadmin" as const,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(platformAuthResponseToJson(user, session), token);
	} catch (error) {
		if (error instanceof InvalidCredentials || error instanceof PlatformAccessDenied) {
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
