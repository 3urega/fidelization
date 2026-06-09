import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreateReward } from "../../../../contexts/loyalty/rewards/application/create/CreateReward";
import { ListRewards } from "../../../../contexts/loyalty/rewards/application/list/ListRewards";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError, rewardToJson } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	name?: string;
	description?: string;
	costPoints?: number;
	type?: string;
};

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const rewards = await container.get(ListRewards).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
		});

		return NextResponse.json({
			rewards: rewards.map((reward) => rewardToJson(reward)),
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

	try {
		const reward = await container.get(CreateReward).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			input: body,
		});

		return NextResponse.json({ reward: rewardToJson(reward) }, { status: 201 });
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
