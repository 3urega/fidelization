import "reflect-metadata";

import { NextResponse } from "next/server";

import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { UploadTenantCoverImage } from "../../../../../contexts/tenants/tenants/application/update/UploadTenantCoverImage";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, tenantToJson } from "../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return NextResponse.json(
			{ error: { description: "Invalid multipart form data" } },
			{ status: 400 },
		);
	}

	const file = formData.get("file");
	if (!(file instanceof File)) {
		return NextResponse.json(
			{ error: { description: "Missing file field" } },
			{ status: 400 },
		);
	}

	try {
		const tenant = await container.get(UploadTenantCoverImage).upload({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			file,
		});

		return NextResponse.json({ tenant: tenantToJson(tenant) });
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		if (error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}

export async function DELETE(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const tenant = await container.get(UploadTenantCoverImage).clear({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
		});

		return NextResponse.json({ tenant: tenantToJson(tenant) });
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		if (error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
