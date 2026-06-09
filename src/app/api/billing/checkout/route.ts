import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreateStripeCheckoutSession } from "../../../../contexts/billing/subscriptions/application/checkout/CreateStripeCheckoutSession";
import { DomainError } from "../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { UserFinder } from "../../../../contexts/identity/users/application/find/UserFinder";
import { TenantNotFound } from "../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { handleAuthDomainError } from "../../../../lib/auth/http";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type Body = {
	planId?: string;
	successUrl?: string;
	cancelUrl?: string;
};

function resolveCheckoutUrl(request: Request, explicit: string | undefined, fallbackPath: string): string {
	if (explicit?.trim()) {
		return explicit.trim();
	}

	const origin = new URL(request.url).origin;

	return `${origin}${fallbackPath}`;
}

export async function POST(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;
	if (!body.planId?.trim()) {
		return NextResponse.json({ error: { description: "planId is required" } }, { status: 400 });
	}

	try {
		const user = await container.get(UserFinder).find(auth.session.userId);
		const result = await container.get(CreateStripeCheckoutSession).execute({
			tenantId: auth.session.tenantId,
			role: auth.session.role as TenantRole,
			planId: body.planId,
			ownerEmail: user.email.value,
			successUrl: resolveCheckoutUrl(request, body.successUrl, "/home?checkout=success"),
			cancelUrl: resolveCheckoutUrl(request, body.cancelUrl, "/onboarding/plan?checkout=cancel"),
		});

		return NextResponse.json({
			checkoutUrl: result.checkoutUrl,
			sessionId: result.sessionId,
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
