import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreateOwnerBusiness } from "../../../../../../contexts/tenants/owners/application/create/CreateOwnerBusiness";
import { OwnerBusinessAlreadyExists } from "../../../../../../contexts/tenants/owners/domain/OwnerBusinessAlreadyExists";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { authResponseToJson, handleAuthDomainError } from "../../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../../lib/auth/session";
import { requireOnboardingSession } from "../../../../../../lib/auth/requireOnboardingSession";

type Body = {
	businessName: string;
	businessType: string;
};

export async function POST(request: Request): Promise<Response> {
	try {
		const auth = await requireOnboardingSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const body = (await request.json()) as Body;
		const businessName = body.businessName?.trim() ?? "";
		const businessType = body.businessType?.trim() ?? "";

		if (!businessName || !businessType) {
			return NextResponse.json(
				{ error: { description: "businessName and businessType are required" } },
				{ status: 400 },
			);
		}

		const result = await container.get(CreateOwnerBusiness).create({
			userId: auth.session.userId,
			businessName,
			businessType,
		});

		const session = {
			kind: "tenant" as const,
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
		if (error instanceof OwnerBusinessAlreadyExists) {
			const response = handleAuthDomainError(error);

			if (response) {
				return response;
			}
		}

		if (error instanceof Error && error.message.startsWith("Invalid business type")) {
			return NextResponse.json({ error: { description: error.message } }, { status: 400 });
		}

		throw error;
	}
}
