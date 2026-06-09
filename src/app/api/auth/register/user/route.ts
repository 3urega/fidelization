import "reflect-metadata";

import { NextResponse } from "next/server";

import { EmailAlreadyRegistered } from "../../../../../contexts/identity/users/domain/EmailAlreadyRegistered";
import { RegisterPlatformUser } from "../../../../../contexts/identity/users/application/register/RegisterPlatformUser";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, userAuthResponseToJson } from "../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../lib/auth/session";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

const MIN_PASSWORD_LENGTH = 8;

type Body = {
	name?: string;
	email?: string;
	password?: string;
	profilePicture?: string;
};

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Unified user registration is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	return null;
}

export async function POST(request: Request): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	try {
		const body = (await request.json()) as Body;

		if (!body.name || !body.email || !body.password) {
			return NextResponse.json(
				{ error: { description: "name, email and password are required" } },
				{ status: 400 },
			);
		}

		const name = body.name.trim();
		const email = body.email.trim().toLowerCase();

		if (!name || !email) {
			return NextResponse.json(
				{ error: { description: "name, email and password are required" } },
				{ status: 400 },
			);
		}

		if (!isValidEmail(email)) {
			return NextResponse.json({ error: { description: "Invalid email format" } }, { status: 400 });
		}

		if (body.password.length < MIN_PASSWORD_LENGTH) {
			return NextResponse.json(
				{ error: { description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` } },
				{ status: 400 },
			);
		}

		const user = await container.get(RegisterPlatformUser).register({
			name,
			email,
			password: body.password,
			profilePicture: body.profilePicture,
		});

		const session = {
			kind: "user" as const,
			userId: user.id.value,
			...(user.qrValue ? { qrValue: user.qrValue } : {}),
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(userAuthResponseToJson(user, session), token, 201);
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
