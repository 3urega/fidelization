import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreateOwnerBusiness } from "../../../../contexts/tenants/owners/application/create/CreateOwnerBusiness";
import { OwnerBusinessAlreadyExists } from "../../../../contexts/tenants/owners/domain/OwnerBusinessAlreadyExists";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, tenantToJson } from "../../../../lib/auth/http";
import { requireUserSession } from "../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

type Body = {
	businessName?: string;
	businessType?: string;
};

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"Platform business registration is only available on the apex host (no business subdomain).",
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
		const auth = await requireUserSession(request);
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

		return NextResponse.json(
			{
				kind: auth.session.kind,
				user: {
					id: result.user.id.value,
					name: result.user.name.value,
					email: result.user.email.value,
				},
				tenant: tenantToJson(result.tenant),
				role: result.role,
			},
			{ status: 201 },
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
