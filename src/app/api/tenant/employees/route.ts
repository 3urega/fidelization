import "reflect-metadata";

import { NextResponse } from "next/server";

import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { InviteTenantEmployee } from "../../../../contexts/tenants/memberships/application/invite/InviteTenantEmployee";
import { ListTenantEmployees } from "../../../../contexts/tenants/memberships/application/invite/ListTenantEmployees";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, tenantEmployeeToJson } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	name?: string;
	email?: string;
	password?: string;
};

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const employees = await container.get(ListTenantEmployees).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
		});

		return NextResponse.json({
			employees: employees.map((employee) => tenantEmployeeToJson(employee)),
		});
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

export async function POST(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;
	if (!body.name?.trim() || !body.email?.trim() || !body.password) {
		return NextResponse.json(
			{ error: { description: "name, email and password are required" } },
			{ status: 400 },
		);
	}

	try {
		const employee = await container.get(InviteTenantEmployee).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			input: body,
		});

		return NextResponse.json({ employee: tenantEmployeeToJson(employee) }, { status: 201 });
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
