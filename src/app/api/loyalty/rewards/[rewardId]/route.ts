import "reflect-metadata";

import { NextResponse } from "next/server";

import { UpdateReward } from "../../../../../contexts/loyalty/rewards/application/update/UpdateReward";
import { DomainError } from "../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, rewardToJson } from "../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	isActive?: boolean;
};

type RouteContext = {
	params: {
		rewardId: string;
	};
};

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;

	try {
		const reward = await container.get(UpdateReward).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			rewardId: context.params.rewardId,
			input: body,
		});

		return NextResponse.json({ reward: rewardToJson(reward) });
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
