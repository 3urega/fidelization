import "reflect-metadata";

import { NextResponse } from "next/server";

import { UserFinder } from "../../../contexts/identity/users/application/find/UserFinder";
import { UserProfileUpdater } from "../../../contexts/identity/users/application/update_profile/UserProfileUpdater";
import { ResolveTenantSubscriptionPlan } from "../../../contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { enabledFeatures } from "../../../contexts/billing/subscriptions/domain/TenantPlanFeature";
import { UserDoesNotExist } from "../../../contexts/identity/users/domain/UserDoesNotExist";
import { container } from "../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, tenantToJson, userToJson } from "../../../lib/auth/http";
import { requireTenantSession } from "../../../lib/auth/requireTenantSession";
import { isImpersonatingTenantSession } from "../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	try {
		const user = await container.get(UserFinder).find(auth.session.userId);
		const plan = await container.get(ResolveTenantSubscriptionPlan).execute(auth.session.tenantId);

		return NextResponse.json({
			user: userToJson(user),
			tenant: tenantToJson(auth.membership.tenant),
			role: auth.session.role,
			planFeatures: enabledFeatures(plan.features),
			...(isImpersonatingTenantSession(auth.session)
				? {
						impersonation: {
							active: true,
							tenantSlug: auth.membership.tenant.slug,
							platformUserId: auth.session.impersonatedBy,
							tenantStatus: auth.membership.tenant.status,
						},
					}
				: {}),
		});
	} catch (error) {
		if (error instanceof UserDoesNotExist) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}

type PatchBody = {
	name?: string;
	profilePicture?: string;
};

export async function PATCH(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as PatchBody;
	if (body.name === undefined && body.profilePicture === undefined) {
		return NextResponse.json(
			{ error: { description: "name or profilePicture required" } },
			{ status: 400 },
		);
	}

	try {
		const finder = container.get(UserFinder);
		const current = await finder.find(auth.session.userId);
		const updater = container.get(UserProfileUpdater);
		const user = await updater.update({
			userId: auth.session.userId,
			name: body.name ?? current.name.value,
			profilePicture: body.profilePicture ?? current.profilePicture.value,
		});

		return NextResponse.json({
			user: userToJson(user),
			tenant: tenantToJson(auth.membership.tenant),
			role: auth.session.role,
		});
	} catch (error) {
		if (error instanceof UserDoesNotExist) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}
