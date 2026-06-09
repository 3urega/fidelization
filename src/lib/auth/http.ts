import { NextResponse } from "next/server";

import { DomainError } from "../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../contexts/shared/infrastructure/http/HttpNextResponse";
import { Customer } from "../../contexts/loyalty/customers/domain/Customer";
import { StampAddedSummary } from "../../contexts/loyalty/customers/application/scan/RecordCustomerVisitByQr";
import { StampCampaign } from "../../contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { Reward } from "../../contexts/loyalty/rewards/domain/Reward";
import { SubscriptionPlan } from "../../contexts/billing/subscriptions/domain/SubscriptionPlan";
import { Tenant } from "../../contexts/tenants/tenants/domain/Tenant";
import { TenantEmployee } from "../../contexts/tenants/memberships/domain/TenantEmployee";
import { CustomerSessionClaims, TenantSessionClaims } from "./session";

export function userToJson(user: {
	id: { value: string };
	name: { value: string };
	email: { value: string };
	profilePicture: { value: string };
	plan: string;
}): Record<string, string> {
	return {
		id: user.id.value,
		name: user.name.value,
		email: user.email.value,
		profilePicture: user.profilePicture.value,
		plan: user.plan,
	};
}

export function tenantToJson(tenant: Tenant): Record<string, string | null> {
	const primitives = tenant.toPrimitives();

	return {
		id: primitives.id,
		name: primitives.name,
		slug: primitives.slug,
		logoUrl: primitives.logoUrl,
		primaryColor: primitives.primaryColor,
		secondaryColor: primitives.secondaryColor,
		subscriptionPlan: primitives.subscriptionPlan,
		subscriptionPlanId: primitives.subscriptionPlanId,
		status: primitives.status,
	};
}

export function platformTenantToJson(tenant: Tenant): Record<string, string> {
	const primitives = tenant.toPrimitives();

	return {
		...tenantToJson(tenant),
		createdAt: primitives.createdAt,
	};
}

export function authResponseToJson(
	user: Parameters<typeof userToJson>[0],
	tenant: Tenant,
	session: TenantSessionClaims,
): Record<string, unknown> {
	return {
		user: userToJson(user),
		tenant: tenantToJson(tenant),
		role: session.role,
		kind: session.kind,
	};
}

export function customerToJson(customer: Customer): Record<string, string | number> {
	const primitives = customer.toPrimitives();

	return {
		id: primitives.id,
		name: primitives.name,
		email: primitives.email ?? "",
		phone: primitives.phone ?? "",
		qrValue: primitives.qrValue,
		pointsBalance: primitives.pointsBalance,
		visitsCount: primitives.visitsCount,
	};
}

export function stampCampaignToJson(
	campaign: StampCampaign,
): Record<string, string | number | boolean | null> {
	const primitives = campaign.toPrimitives();

	return {
		id: primitives.id,
		name: primitives.name,
		requiredStamps: primitives.requiredStamps,
		isActive: primitives.isActive,
		rewardId: primitives.rewardId,
	};
}

export function rewardToJson(
	reward: Reward,
): Record<string, string | number | boolean | null> {
	const primitives = reward.toPrimitives();

	return {
		id: primitives.id,
		name: primitives.name,
		description: primitives.description,
		costPoints: primitives.costPoints,
		type: primitives.type,
		isActive: primitives.isActive,
		stockLimit: primitives.stockLimit,
	};
}

export function tenantEmployeeToJson(
	employee: TenantEmployee,
): Record<string, string> {
	return {
		id: employee.membershipId,
		userId: employee.userId,
		name: employee.name,
		email: employee.email,
		role: employee.role,
	};
}

export function subscriptionPlanToJson(
	plan: SubscriptionPlan,
): Record<string, string | number | boolean | null | Record<string, boolean | number>> {
	const primitives = plan.toPrimitives();

	return {
		id: primitives.id,
		name: primitives.name,
		priceMonthly: primitives.priceMonthly,
		priceYearly: primitives.priceYearly,
		features: primitives.features,
		limits: primitives.limits,
		isActive: primitives.isActive,
	};
}

export function stampAddedSummaryToJson(
	summary: StampAddedSummary,
): Record<string, string | number | boolean> {
	return stampProgressToJson(summary);
}

export function stampProgressToJson(
	summary: StampAddedSummary,
): Record<string, string | number | boolean> {
	return {
		campaignId: summary.campaignId,
		campaignName: summary.campaignName,
		current: summary.current,
		required: summary.required,
		completed: summary.completed,
	};
}

export function customerAuthResponseToJson(
	customer: Customer,
	session: CustomerSessionClaims,
): Record<string, unknown> {
	return {
		customer: customerToJson(customer),
		kind: session.kind,
		tenantId: session.tenantId,
	};
}

export function platformAuthResponseToJson(
	user: Parameters<typeof userToJson>[0],
	session: { role: string; kind: string },
): Record<string, unknown> {
	return {
		user: userToJson(user),
		role: session.role,
		kind: session.kind,
	};
}

export function handleAuthDomainError(error: DomainError): NextResponse | undefined {
	if (error.type === "InvalidCredentials") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "EmailAlreadyRegistered") {
		return HttpNextResponse.domainError(error, 409);
	}
	if (error.type === "UserDoesNotExist") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "OwnerMembershipNotFound") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "StaffMembershipNotFound") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "CrossTenantAccessDenied") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidTenantSession") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "PlatformAccessDenied") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "PlatformUserCannotUseTenantLogin") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "TenantAccessSuspended") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "OwnerBusinessAlreadyExists") {
		return HttpNextResponse.domainError(error, 409);
	}
	if (error.type === "TenantBrandingForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "TenantEmployeesForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidTenantBranding") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "CustomerNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "InvalidCustomerSession") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "StampCampaignForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidStampCampaign") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "StampCampaignNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "RewardForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidReward") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "RewardNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "InsufficientCustomerPoints") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "RewardInactive") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "TenantBillingForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "SubscriptionPlanNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "FreePlanDoesNotRequireCheckout") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "TenantAlreadyHasActiveSubscription") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "StripeCheckoutNotConfigured") {
		return HttpNextResponse.domainError(error, 503);
	}
	if (error.type === "InvalidStripeWebhookSignature") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "StripeCheckoutSessionIncomplete") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "StripeSubscriptionNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "PlanFeatureNotAvailable") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "TenantPlanLimitExceeded") {
		return HttpNextResponse.domainError(error, 403);
	}

	return undefined;
}
