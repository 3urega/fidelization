import "reflect-metadata";

import { NextResponse } from "next/server";

import { EmailAlreadyRegistered } from "../../../../../contexts/identity/users/domain/EmailAlreadyRegistered";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { RegisterBusinessOwnerUser } from "../../../../../contexts/tenants/owners/application/register/RegisterBusinessOwnerUser";
import { handleAuthDomainError, userToJson } from "../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../lib/auth/session";

const MIN_PASSWORD_LENGTH = 8;

type Body = {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	profilePicture?: string;
};

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request): Promise<Response> {
	try {
		const body = (await request.json()) as Body;

		if (!body.name || !body.email || !body.password || !body.confirmPassword) {
			return NextResponse.json(
				{ error: { description: "name, email, password and confirmPassword are required" } },
				{ status: 400 },
			);
		}

		const name = body.name.trim();
		const email = body.email.trim().toLowerCase();
		const password = body.password;
		const confirmPassword = body.confirmPassword;

		if (!name || !email) {
			return NextResponse.json(
				{ error: { description: "name, email, password and confirmPassword are required" } },
				{ status: 400 },
			);
		}

		if (!isValidEmail(email)) {
			return NextResponse.json({ error: { description: "Invalid email format" } }, { status: 400 });
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			return NextResponse.json(
				{ error: { description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` } },
				{ status: 400 },
			);
		}

		if (password !== confirmPassword) {
			return NextResponse.json(
				{ error: { description: "Passwords do not match" } },
				{ status: 400 },
			);
		}

		const result = await container.get(RegisterBusinessOwnerUser).register({
			name,
			email,
			password,
			profilePicture: body.profilePicture,
		});

		const session = {
			kind: "onboarding" as const,
			userId: result.user.id.value,
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(
			{
				user: userToJson(result.user),
				intendedRole: result.intendedRole,
			},
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
