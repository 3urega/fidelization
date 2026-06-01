import "reflect-metadata";

import { NextResponse } from "next/server";

import { EmailAlreadyRegistered } from "../../../../contexts/identity/users/domain/EmailAlreadyRegistered";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { OwnerRegistrar } from "../../../../contexts/tenants/owners/application/register/OwnerRegistrar";
import { RegisterOwnerResult } from "../../../../contexts/tenants/owners/domain/OwnerOnboardingRepository";
import { authResponseToJson, handleAuthDomainError } from "../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../lib/auth/session";

type Body = {
	name: string;
	email: string;
	password: string;
	businessName: string;
	profilePicture?: string;
};

export async function POST(request: Request): Promise<Response> {
	try {
		const body = (await request.json()) as Body;
		if (!body.name || !body.email || !body.password || !body.businessName) {
			return NextResponse.json(
				{ error: { description: "name, email, password and businessName are required" } },
				{ status: 400 },
			);
		}

		const result: RegisterOwnerResult = await container.get(OwnerRegistrar).register({
			name: body.name,
			email: body.email,
			password: body.password,
			businessName: body.businessName,
			profilePicture: body.profilePicture,
		});

		const session = {
			userId: result.user.id.value,
			tenantId: result.tenant.id,
			role: result.role,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(
			authResponseToJson(result.user, result.tenant, session),
			token,
			201,
		);
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
