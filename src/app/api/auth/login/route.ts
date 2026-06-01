import "reflect-metadata";

import { NextResponse } from "next/server";

import { UserAuthenticator } from "../../../../contexts/identity/users/application/authenticate/UserAuthenticator";
import { InvalidCredentials } from "../../../../contexts/identity/users/domain/InvalidCredentials";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { OwnerMembershipFinder } from "../../../../contexts/tenants/memberships/application/find/OwnerMembershipFinder";
import { OwnerMembershipNotFound } from "../../../../contexts/tenants/memberships/domain/OwnerMembershipNotFound";
import { authResponseToJson, handleAuthDomainError } from "../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../lib/auth/session";

type Body = {
	email: string;
	password: string;
};

export async function POST(request: Request): Promise<Response> {
	try {
		const body = (await request.json()) as Body;
		if (!body.email || !body.password) {
			return NextResponse.json(
				{ error: { description: "email and password are required" } },
				{ status: 400 },
			);
		}

		const authenticator = container.get(UserAuthenticator);
		const user = await authenticator.login(body.email, body.password);
		const membership = await container.get(OwnerMembershipFinder).find(user.id.value);
		const session = {
			userId: user.id.value,
			tenantId: membership.tenant.id,
			role: membership.role,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(authResponseToJson(user, membership.tenant, session), token);
	} catch (error) {
		if (error instanceof InvalidCredentials || error instanceof OwnerMembershipNotFound) {
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
