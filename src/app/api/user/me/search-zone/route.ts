import "reflect-metadata";

import { NextResponse } from "next/server";

import { ClearUserSearchZone } from "../../../../../contexts/identity/users/application/profile/ClearUserSearchZone";
import { UpdateUserSearchZone } from "../../../../../contexts/identity/users/application/profile/UpdateUserSearchZone";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, userAuthResponseToJson } from "../../../../../lib/auth/http";
import { requireUserSession } from "../../../../../lib/auth/requireUserSession";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"User search zone is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	return null;
}

type PatchBody = {
	label?: string;
	latitude?: number;
	longitude?: number;
};

export async function PATCH(request: Request): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	try {
		const auth = await requireUserSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const body = (await request.json()) as PatchBody;
		const label = typeof body.label === "string" ? body.label : "";
		const latitude = body.latitude;
		const longitude = body.longitude;

		if (typeof latitude !== "number" || typeof longitude !== "number") {
			return NextResponse.json(
				{ error: { description: "latitude and longitude are required numbers" } },
				{ status: 400 },
			);
		}

		const user = await container.get(UpdateUserSearchZone).execute({
			userId: auth.session.userId,
			label,
			latitude,
			longitude,
		});

		return NextResponse.json(userAuthResponseToJson(user, { kind: "user" }));
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}

export async function DELETE(request: Request): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	try {
		const auth = await requireUserSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const user = await container.get(ClearUserSearchZone).execute({
			userId: auth.session.userId,
		});

		return NextResponse.json(userAuthResponseToJson(user, { kind: "user" }));
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}
