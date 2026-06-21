import { NextResponse } from "next/server";

import { DomainError } from "../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../contexts/shared/infrastructure/http/HttpNextResponse";
import { Customer } from "../../contexts/loyalty/customers/domain/Customer";
import type { StampAddedSummary } from "../../contexts/loyalty/customers/domain/StampProgressSummary";
import type { StaffScanOutcome } from "../../contexts/loyalty/customers/domain/StaffScanOutcome";
import type {
	StaffScanCampaignTarget,
	StaffScanPromotionTarget,
	StaffScanTargets,
} from "../../contexts/loyalty/customers/domain/StaffScanTargets";
import { StampCampaign } from "../../contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import type { CustomerDetailView } from "../../contexts/loyalty/customers/domain/analytics/CustomerDetail";
import type { CustomerInsightsSummary } from "../../contexts/loyalty/customers/domain/analytics/CustomerInsightsSummary";
import type { CustomerListRow } from "../../contexts/loyalty/customers/domain/analytics/CustomerListRow";
import type { CustomerNearRewardProgress } from "../../contexts/loyalty/customers/domain/analytics/CustomerNearRewardProgress";
import type { ListTenantCustomersBySegmentResult } from "../../contexts/loyalty/customers/application/analytics/ListTenantCustomersBySegment";
import type { ListStampCampaignDashboardResult } from "../../contexts/loyalty/stamp_campaigns/application/dashboard/ListStampCampaignDashboard";
import { StampType } from "../../contexts/loyalty/stamp_types/domain/StampType";
import { Reward } from "../../contexts/loyalty/rewards/domain/Reward";
import { Promotion } from "../../contexts/loyalty/promotions/domain/Promotion";
import type { CustomerPromotionSummary } from "../../contexts/loyalty/promotions/domain/CustomerPromotionSummary";
import type { PlatformDashboardMetrics } from "../../contexts/platform/domain/PlatformDashboardMetrics";
import type { PlatformTenantDetail } from "../../contexts/platform/domain/PlatformTenantDetail";
import type { UserSearchZone } from "../../contexts/identity/users/domain/UserSearchZone";
import { SubscriptionPlan } from "../../contexts/billing/subscriptions/domain/SubscriptionPlan";
import { Tenant } from "../../contexts/tenants/tenants/domain/Tenant";
import type { TenantProfileUpdateResult } from "../../contexts/tenants/tenants/domain/TenantProfileUpdateResult";
import { TenantEmployee } from "../../contexts/tenants/memberships/domain/TenantEmployee";
import { CustomerSessionClaims, TenantSessionClaims } from "./session";

export function searchZoneToJson(
	zone: UserSearchZone | null,
): Record<string, string | number> | null {
	if (!zone) {
		return null;
	}

	const primitives = zone.toPrimitives();

	return {
		label: primitives.label,
		latitude: primitives.latitude,
		longitude: primitives.longitude,
		updatedAt: primitives.updatedAt,
	};
}

export function userToJson(user: {
	id: { value: string };
	name: { value: string };
	email: { value: string };
	profilePicture: { value: string };
	plan: string;
	qrValue?: string | null;
	searchZone?: UserSearchZone | null;
}): Record<string, string | null | Record<string, string | number>> {
	return {
		id: user.id.value,
		name: user.name.value,
		email: user.email.value,
		profilePicture: user.profilePicture.value,
		plan: user.plan,
		qrValue: user.qrValue ?? null,
		searchZone: searchZoneToJson(user.searchZone ?? null),
	};
}

export function tenantToJson(tenant: Tenant): Record<string, string | number | null | string[]> {
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
		address: primitives.address ?? "",
		description: primitives.description ?? "",
		coverImageUrl: primitives.coverImageUrl ?? "",
		discoveryTags: primitives.discoveryTags ?? [],
		latitude: primitives.latitude ?? null,
		longitude: primitives.longitude ?? null,
		geocodingProvider: primitives.geocodingProvider ?? null,
		geocodedAt: primitives.geocodedAt ?? null,
	};
}

export function tenantProfileUpdateToJson(
	result: TenantProfileUpdateResult,
): Record<string, unknown> {
	return {
		tenant: tenantToJson(result.tenant),
		geocodingStatus: result.geocodingStatus,
		...(result.geocodingMessage ? { geocodingMessage: result.geocodingMessage } : {}),
	};
}

export function platformTenantToJson(tenant: Tenant): Record<string, string> {
	const primitives = tenant.toPrimitives();

	return {
		...tenantToJson(tenant),
		createdAt: primitives.createdAt,
	};
}

export function platformDashboardMetricsToJson(
	metrics: PlatformDashboardMetrics,
): Record<string, unknown> {
	return {
		tenantsActive: metrics.tenantsActive,
		tenantsSuspended: metrics.tenantsSuspended,
		usersRegistered: metrics.usersRegistered,
		qrScansToday: metrics.qrScansToday,
		stampsToday: metrics.stampsToday,
		activePromotions: metrics.activePromotions,
		subscriptionsPastDue: metrics.subscriptionsPastDue,
		recentTenants: metrics.recentTenants.map((tenant) => ({
			id: tenant.id,
			name: tenant.name,
			slug: tenant.slug,
			status: tenant.status,
			createdAt: tenant.createdAt.toISOString(),
		})),
		generatedAt: metrics.generatedAt.toISOString(),
		timezone: metrics.timezone,
	};
}

export function platformTenantDetailToJson(
	detail: PlatformTenantDetail,
): Record<string, unknown> {
	return {
		tenant: platformTenantToJson(detail.tenant),
		owners: detail.owners.map((owner) => ({
			userId: owner.userId,
			name: owner.name,
			email: owner.email,
		})),
		activity: {
			customersCount: detail.activity.customersCount,
			staffCount: detail.activity.staffCount,
			qrScansCount: detail.activity.qrScansCount,
		},
		availablePlans: detail.availablePlans.map((plan) => subscriptionPlanToJson(plan)),
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
		stampTypeId: primitives.stampTypeId,
		visualTemplate: primitives.visualTemplate,
		cardBackgroundVariant: primitives.cardBackgroundVariant,
		conditions: primitives.conditions,
	};
}

export function stampTypeToJson(
	stampType: StampType,
): Record<string, string | number | boolean> {
	const primitives = stampType.toPrimitives();

	return {
		id: primitives.id,
		label: primitives.label,
		slug: primitives.slug,
		sortOrder: primitives.sortOrder,
		isActive: primitives.isActive,
	};
}

function customerZoneNearRewardToJson(
	nearReward: CustomerNearRewardProgress,
): Record<string, string | number> {
	return {
		campaignId: nearReward.campaignId,
		campaignName: nearReward.campaignName,
		current: nearReward.current,
		required: nearReward.required,
	};
}

export function customerZoneListRowToJson(
	row: CustomerListRow,
): Record<string, string | number | null | Record<string, string | number>> {
	const json: Record<string, string | number | null | Record<string, string | number>> = {
		id: row.id,
		name: row.name,
		lastVisitAt: row.lastVisitAt?.toISOString() ?? null,
		visitsThisMonth: row.visitsThisMonth,
		visitsCount: row.visitsCount,
		totalStamps: row.totalStamps,
		rewardsRedeemedCount: row.rewardsRedeemedCount,
		status: row.status,
	};

	if (row.nearReward) {
		json.nearReward = customerZoneNearRewardToJson(row.nearReward);
	}

	return json;
}

export function customerZoneInsightsToJson(
	summary: CustomerInsightsSummary,
): Record<string, string | number> {
	return {
		vipCount: summary.vipCount,
		atRiskCount: summary.atRiskCount,
		nearRewardCount: summary.nearRewardCount,
		newThisMonthCount: summary.newThisMonthCount,
		generatedAt: summary.generatedAt.toISOString(),
		timezone: summary.timezone,
	};
}

export function customerZoneListToJson(
	result: ListTenantCustomersBySegmentResult,
): Record<string, unknown> {
	return {
		segment: result.segment,
		customers: result.customers.map(customerZoneListRowToJson),
		generatedAt: result.generatedAt.toISOString(),
		timezone: result.timezone,
	};
}

export function customerZoneDetailToJson(
	detail: CustomerDetailView,
): Record<string, unknown> {
	return {
		id: detail.id,
		name: detail.name,
		email: detail.email ?? "",
		phone: detail.phone ?? "",
		customerSince: detail.customerSince.toISOString(),
		visitsCount: detail.visitsCount,
		pointsBalance: detail.pointsBalance,
		status: detail.status,
		stampProgress: detail.stampProgress.map((row) =>
			stampProgressToJson({
				campaignId: row.campaignId,
				campaignName: row.campaignName,
				current: row.current,
				required: row.required,
				completed: row.completed,
				stampTypeId: null,
				stampTypeLabel: row.stampTypeLabel,
				visualTemplate: "",
				cardBackgroundVariant: "",
				conditions: "",
			}),
		),
		recentActivity: detail.recentActivity.map((row) => ({
			occurredAt: row.occurredAt.toISOString(),
			label: row.label,
		})),
		rewardsRedeemed: detail.rewardsRedeemed.map((row) => ({
			rewardName: row.rewardName,
			redeemedAt: row.redeemedAt.toISOString(),
		})),
	};
}

export function stampCampaignDashboardToJson(
	result: ListStampCampaignDashboardResult,
): Record<string, unknown> {
	return {
		campaigns: result.campaigns.map((row) => ({
			id: row.campaignId,
			name: row.name,
			stampTypeLabel: row.stampTypeLabel,
			requiredStamps: row.requiredStamps,
			createdAt: row.createdAt.toISOString(),
			scans: {
				today: row.scans.today,
				yesterday: row.scans.yesterday,
				last7Days: row.scans.last7Days,
				sinceStart: row.scans.sinceStart,
			},
		})),
		generatedAt: result.generatedAt.toISOString(),
		timezone: result.timezone,
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

export function promotionToJson(
	promotion: Promotion,
): Record<string, string | boolean | number | null> {
	const primitives = promotion.toPrimitives();

	return {
		id: primitives.id,
		title: primitives.title,
		description: primitives.description,
		type: primitives.type,
		startDate: primitives.startDate,
		endDate: primitives.endDate,
		isActive: primitives.isActive,
		maxUsesPerUser: primitives.maxUsesPerUser,
	};
}

export function customerPromotionSummaryToJson(
	summary: CustomerPromotionSummary,
): Record<string, string | boolean | number | null> {
	return {
		id: summary.id,
		title: summary.title,
		description: summary.description,
		type: summary.type,
		startDate: summary.startDate,
		endDate: summary.endDate,
		isActive: summary.isActive,
		maxUsesPerUser: summary.maxUsesPerUser,
		usedCount: summary.usedCount,
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
): Record<string, string | number | boolean | null> {
	return stampProgressToJson(summary);
}

export function stampProgressToJson(
	summary: StampAddedSummary,
): Record<string, string | number | boolean | null> {
	return {
		campaignId: summary.campaignId,
		campaignName: summary.campaignName,
		current: summary.current,
		required: summary.required,
		completed: summary.completed,
		stampTypeId: summary.stampTypeId,
		stampTypeLabel: summary.stampTypeLabel,
		visualTemplate: summary.visualTemplate,
		cardBackgroundVariant: summary.cardBackgroundVariant,
		conditions: summary.conditions ?? "",
	};
}

export function staffScanCampaignTargetToJson(
	target: StaffScanCampaignTarget,
): Record<string, string | number> {
	return {
		id: target.id,
		name: target.name,
		requiredStamps: target.requiredStamps,
		visualTemplate: target.visualTemplate,
		cardBackgroundVariant: target.cardBackgroundVariant,
		stampTypeLabel: target.stampTypeLabel,
		conditions: target.conditions,
	};
}

export function staffScanPromotionTargetToJson(
	target: StaffScanPromotionTarget,
): Record<string, string | number | null> {
	return {
		id: target.id,
		title: target.title,
		description: target.description,
		maxUsesPerUser: target.maxUsesPerUser,
	};
}

export function staffScanTargetsToJson(targets: StaffScanTargets): Record<string, unknown> {
	return {
		stampCampaigns: targets.stampCampaigns.map(staffScanCampaignTargetToJson),
		promotions: targets.promotions.map(staffScanPromotionTargetToJson),
	};
}

export function staffScanOutcomeToJson(outcome: StaffScanOutcome): Record<string, string | number | null> {
	switch (outcome.kind) {
		case "point_recorded":
			return { kind: outcome.kind, pointsBalance: outcome.pointsBalance };
		case "stamp_added":
			return {
				kind: outcome.kind,
				campaignId: outcome.campaignId,
				campaignName: outcome.campaignName,
				current: outcome.current,
				required: outcome.required,
			};
		case "card_completed":
		case "card_already_completed":
			return {
				kind: outcome.kind,
				campaignId: outcome.campaignId,
				campaignName: outcome.campaignName,
			};
		case "promotion_applied":
			return {
				kind: outcome.kind,
				promotionId: outcome.promotionId,
				promotionTitle: outcome.promotionTitle,
				usedCount: outcome.usedCount,
				maxUsesPerUser: outcome.maxUsesPerUser,
			};
		case "promotion_exhausted":
			return {
				kind: outcome.kind,
				promotionId: outcome.promotionId,
				promotionTitle: outcome.promotionTitle,
				maxUsesPerUser: outcome.maxUsesPerUser,
			};
		default: {
			const exhaustive: never = outcome;

			return exhaustive;
		}
	}
}

export function staffScanOutcomesToJson(outcomes: StaffScanOutcome[]): Record<string, unknown>[] {
	return outcomes.map(staffScanOutcomeToJson);
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

export function userAuthResponseToJson(
	user: Parameters<typeof userToJson>[0],
	session: { kind: "user" },
): Record<string, unknown> {
	return {
		user: userToJson(user),
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
	if (error.type === "InvalidGoogleToken") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "OAuthAccountAlreadyLinked") {
		return HttpNextResponse.domainError(error, 409);
	}
	if (error.type === "UserDoesNotExist") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "TenantNotFound") {
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
	if (error.type === "PlatformUserCannotUseUserLogin") {
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
	if (error.type === "TenantProfileForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "TenantEmployeesForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidTenantBranding") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "InvalidTenantProfile") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "TenantGeocodingAddressRequired") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "InvalidTenantCoverImage") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "CustomerNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "CustomerNotRegisteredInTenant") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "InvalidCustomerSession") {
		return HttpNextResponse.domainError(error, 401);
	}
	if (error.type === "StampCampaignForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "CustomerZoneForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidStampCampaign") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "StampCampaignNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "StampCampaignActiveCannotBeDeleted") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "StampTypeForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "InvalidStampType") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "StampTypeNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "InvalidStampScan") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "StaffScanForbidden") {
		return HttpNextResponse.domainError(error, 403);
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
	if (error.type === "PromotionForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "RouletteConfigForbidden") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "RouletteGameDisabled") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "RouletteGameNotAvailable") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "RouletteSpinRateLimitExceeded") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "RouletteSpinNotEligible") {
		return HttpNextResponse.domainError(error, 403);
	}
	if (error.type === "RouletteSegmentsExhausted") {
		return HttpNextResponse.domainError(error, 409);
	}
	if (error.type === "TenantGameActivationNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "InvalidRouletteConfig") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "InvalidPromotion") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "PromotionNotFound") {
		return HttpNextResponse.domainError(error, 404);
	}
	if (error.type === "PromotionUsageLimitReached") {
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
	if (error.type === "InvalidUserSearchZone") {
		return HttpNextResponse.domainError(error, 400);
	}
	if (error.type === "InvalidCoordinates") {
		return HttpNextResponse.domainError(error, 400);
	}

	return undefined;
}
