import "reflect-metadata";

import { ContainerBuilder } from "diod";

import { loadProjectEnv } from "../../../../lib/loadProjectEnv";
import { DemoPlanSetter } from "../../../billing/demo/application/DemoPlanSetter";
import { SyncUserPlanFromGooglePlay } from "../../../billing/google_play_subscription/application/sync/SyncUserPlanFromGooglePlay";
import { VerifyGooglePlayPurchase } from "../../../billing/google_play_subscription/application/verify/VerifyGooglePlayPurchase";
import { GooglePlaySubscriptionRepository } from "../../../billing/google_play_subscription/domain/GooglePlaySubscriptionRepository";
import { PostgresGooglePlaySubscriptionRepository } from "../../../billing/google_play_subscription/infrastructure/PostgresGooglePlaySubscriptionRepository";
import { TenantBillingRepository } from "../../../billing/subscriptions/domain/TenantBillingRepository";
import { AssignTenantSubscriptionPlan } from "../../../billing/subscriptions/application/assign/AssignTenantSubscriptionPlan";
import { AssertTenantEmployeeLimit } from "../../../billing/subscriptions/application/guard/AssertTenantEmployeeLimit";
import { AssertTenantPlanFeature } from "../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantEffectivePlanFeatures } from "../../../billing/subscriptions/application/resolve/ResolveTenantEffectivePlanFeatures";
import { ResolveTenantSubscriptionPlan } from "../../../billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { ListPlatformPlanFeatures, UpdatePlatformPlanFeatures } from "../../../platform/application/features/PlatformPlanFeatures";
import { GetPlatformTenantFeatures, UpdatePlatformTenantFeatures } from "../../../platform/application/features/PlatformTenantFeatures";
import { CreateStripeCheckoutSession } from "../../../billing/subscriptions/application/checkout/CreateStripeCheckoutSession";
import { CompleteStripeCheckoutSession } from "../../../billing/subscriptions/application/checkout/CompleteStripeCheckoutSession";
import { SyncTenantSubscriptionFromStripe } from "../../../billing/subscriptions/application/sync/SyncTenantSubscriptionFromStripe";
import { ProcessStripeWebhook } from "../../../billing/subscriptions/application/sync/ProcessStripeWebhook";
import { StripeWebhookEventRepository } from "../../../billing/stripe/domain/StripeWebhookEventRepository";
import { PrismaStripeWebhookEventRepository } from "../../../billing/stripe/infrastructure/PrismaStripeWebhookEventRepository";
import { ListPlatformSubscriptionPlans } from "../../../billing/subscriptions/application/list/ListPlatformSubscriptionPlans";
import { ListSubscriptionPlans } from "../../../billing/subscriptions/application/list/ListSubscriptionPlans";
import { UpdateSubscriptionPlan } from "../../../billing/subscriptions/application/update/UpdateSubscriptionPlan";
import { StripeCheckoutGateway } from "../../../billing/stripe/domain/StripeCheckoutGateway";
import { StripeWebhookGateway } from "../../../billing/stripe/domain/StripeWebhookGateway";
import { StripeCheckoutGatewayStripe } from "../../../billing/stripe/infrastructure/StripeCheckoutGatewayStripe";
import { StripeWebhookGatewayStripe } from "../../../billing/stripe/infrastructure/StripeWebhookGatewayStripe";
import { PrismaTenantBillingRepository } from "../../../billing/subscriptions/infrastructure/PrismaTenantBillingRepository";
import { UserAuthenticator } from "../../../identity/users/application/authenticate/UserAuthenticator";
import { AuthenticateGoogleUser } from "../../../identity/users/application/authenticate/AuthenticateGoogleUser";
import { EnterPlatformUserFromTenantSession } from "../../../identity/users/application/authenticate/EnterPlatformUserFromTenantSession";
import { LoginPlatformUser } from "../../../identity/users/application/authenticate/LoginPlatformUser";
import { EnsureUserQrValue } from "../../../identity/users/application/profile/EnsureUserQrValue";
import { RegisterPlatformUser } from "../../../identity/users/application/register/RegisterPlatformUser";
import { UserFinder } from "../../../identity/users/application/find/UserFinder";
import { UserRegistrar } from "../../../identity/users/application/register/UserRegistrar";
import { UserProfileUpdater } from "../../../identity/users/application/update_profile/UserProfileUpdater";
import { GoogleIdTokenVerifier } from "../../../identity/users/domain/GoogleIdTokenVerifier";
import { UserRepository } from "../../../identity/users/domain/UserRepository";
import { GoogleIdTokenVerifierGoogle } from "../../../identity/users/infrastructure/GoogleIdTokenVerifierGoogle";
import { PrismaUserRepository } from "../../../identity/users/infrastructure/PrismaUserRepository";
import { CouponRepository } from "../../../loyalty/coupons/domain/CouponRepository";
import { PrismaCouponRepository } from "../../../loyalty/coupons/infrastructure/PrismaCouponRepository";
import { AuthenticateCustomerByQr } from "../../../loyalty/customers/application/authenticate/AuthenticateCustomerByQr";
import { GetCustomerActiveRewards } from "../../../loyalty/customers/application/profile/GetCustomerActiveRewards";
import { GetCustomerStampProgress } from "../../../loyalty/customers/application/profile/GetCustomerStampProgress";
import { GetEstablishmentDetailForUser } from "../../../loyalty/customers/application/profile/GetEstablishmentDetailForUser";
import { GetTenantCustomerDetail } from "../../../loyalty/customers/application/analytics/GetTenantCustomerDetail";
import { GetTenantCustomerInsights } from "../../../loyalty/customers/application/analytics/GetTenantCustomerInsights";
import { ListTenantCustomersBySegment } from "../../../loyalty/customers/application/analytics/ListTenantCustomersBySegment";
import { TenantCustomerAnalyticsRepository } from "../../../loyalty/customers/domain/analytics/TenantCustomerAnalyticsRepository";
import { PrismaTenantCustomerAnalyticsRepository } from "../../../loyalty/customers/infrastructure/PrismaTenantCustomerAnalyticsRepository";
import { RedeemCustomerReward } from "../../../loyalty/customers/application/redeem/RedeemCustomerReward";
import { RecordPromotionUse } from "../../../loyalty/customers/application/promotions/RecordPromotionUse";
import { ResolveCustomerByQrForStaffScan } from "../../../loyalty/customers/application/scan/ResolveCustomerByQrForStaffScan";
import { RecordStaffScanByTarget } from "../../../loyalty/customers/application/scan/RecordStaffScanByTarget";
import { ListStaffScanTargets } from "../../../loyalty/customers/application/scan/ListStaffScanTargets";
import { RegisterCustomer } from "../../../loyalty/customers/application/register/RegisterCustomer";
import { JoinTenantAsCustomer } from "../../../loyalty/customers/application/join/JoinTenantAsCustomer";
import { CustomerSessionVerifier } from "../../../loyalty/customers/application/verify/CustomerSessionVerifier";
import { CustomerRepository } from "../../../loyalty/customers/domain/CustomerRepository";
import { PrismaCustomerRepository } from "../../../loyalty/customers/infrastructure/PrismaCustomerRepository";
import { LoyaltyTransactionRepository } from "../../../loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { PrismaLoyaltyTransactionRepository } from "../../../loyalty/loyalty_transactions/infrastructure/PrismaLoyaltyTransactionRepository";
import { NotificationRepository } from "../../../loyalty/notifications/domain/NotificationRepository";
import { PrismaNotificationRepository } from "../../../loyalty/notifications/infrastructure/PrismaNotificationRepository";
import { PromotionRepository } from "../../../loyalty/promotions/domain/PromotionRepository";
import { CustomerPromotionUsageRepository } from "../../../loyalty/promotions/domain/CustomerPromotionUsageRepository";
import { PrismaCustomerPromotionUsageRepository } from "../../../loyalty/promotions/infrastructure/PrismaCustomerPromotionUsageRepository";
import { PrismaPromotionRepository } from "../../../loyalty/promotions/infrastructure/PrismaPromotionRepository";
import { CreateReward } from "../../../loyalty/rewards/application/create/CreateReward";
import { ListRewards } from "../../../loyalty/rewards/application/list/ListRewards";
import { UpdateReward } from "../../../loyalty/rewards/application/update/UpdateReward";
import { ListActivePromotionsForCustomer } from "../../../loyalty/promotions/application/list/ListActivePromotionsForCustomer";
import { ListCustomerPromotionSummaries } from "../../../loyalty/promotions/application/list/ListCustomerPromotionSummaries";
import { ListUserCrossTenantPromotions } from "../../../loyalty/promotions/application/list/ListUserCrossTenantPromotions";
import { ListPromotions } from "../../../loyalty/promotions/application/list/ListPromotions";
import { CreatePromotion } from "../../../loyalty/promotions/application/create/CreatePromotion";
import { UpdatePromotion } from "../../../loyalty/promotions/application/update/UpdatePromotion";
import { RewardRepository } from "../../../loyalty/rewards/domain/RewardRepository";
import { PrismaRewardRepository } from "../../../loyalty/rewards/infrastructure/PrismaRewardRepository";
import { StampCampaignRepository } from "../../../loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { CreateStampCampaign } from "../../../loyalty/stamp_campaigns/application/create/CreateStampCampaign";
import { CreateStampCampaignFromPlatformTemplate } from "../../../loyalty/stamp_campaigns/application/adopt/CreateStampCampaignFromPlatformTemplate";
import { ListStampCampaigns } from "../../../loyalty/stamp_campaigns/application/list/ListStampCampaigns";
import { ListStampCampaignDashboard } from "../../../loyalty/stamp_campaigns/application/dashboard/ListStampCampaignDashboard";
import { UpdateStampCampaign } from "../../../loyalty/stamp_campaigns/application/update/UpdateStampCampaign";
import { DeleteStampCampaign } from "../../../loyalty/stamp_campaigns/application/delete/DeleteStampCampaign";
import { PrismaStampCampaignRepository } from "../../../loyalty/stamp_campaigns/infrastructure/PrismaStampCampaignRepository";
import { StampCampaignScanStatsRepository } from "../../../loyalty/stamp_campaigns/domain/StampCampaignScanStatsRepository";
import { PrismaStampCampaignScanStatsRepository } from "../../../loyalty/stamp_campaigns/infrastructure/PrismaStampCampaignScanStatsRepository";
import { StampTypeRepository } from "../../../loyalty/stamp_types/domain/StampTypeRepository";
import { CreateStampType } from "../../../loyalty/stamp_types/application/create/CreateStampType";
import { ListStampTypes } from "../../../loyalty/stamp_types/application/list/ListStampTypes";
import { UpdateStampType } from "../../../loyalty/stamp_types/application/update/UpdateStampType";
import { PrismaStampTypeRepository } from "../../../loyalty/stamp_types/infrastructure/PrismaStampTypeRepository";
import { PlatformAuthenticator } from "../../../platform/application/authenticate/PlatformAuthenticator";
import { GetPlatformAnalyticsSummary } from "../../../platform/application/analytics/GetPlatformAnalyticsSummary";
import { GetPlatformBillingOverview } from "../../../platform/application/billing/GetPlatformBillingOverview";
import { GetPlatformDashboardMetrics } from "../../../platform/application/dashboard/GetPlatformDashboardMetrics";
import { AssignPlatformTenantSubscriptionPlan } from "../../../platform/application/tenants/AssignPlatformTenantSubscriptionPlan";
import { EndPlatformImpersonation } from "../../../platform/application/impersonation/EndPlatformImpersonation";
import { ImpersonateTenantOwnerFromPlatformSession } from "../../../platform/application/impersonation/ImpersonateTenantOwnerFromPlatformSession";
import { CreatePlatformCampaignTemplate } from "../../../platform/application/campaign_templates/CreatePlatformCampaignTemplate";
import { ListPlatformCampaignTemplates } from "../../../platform/application/campaign_templates/ListPlatformCampaignTemplates";
import { UpdatePlatformCampaignTemplate } from "../../../platform/application/campaign_templates/UpdatePlatformCampaignTemplate";
import { CreatePlatformGame } from "../../../platform/application/games/CreatePlatformGame";
import { ListPlatformGames } from "../../../platform/application/games/ListPlatformGames";
import { UpdatePlatformGame } from "../../../platform/application/games/UpdatePlatformGame";
import { ListAvailablePlatformGamesForTenant } from "../../../platform/application/games/ListAvailablePlatformGamesForTenant";
import { GetPlatformAppUserDetail } from "../../../platform/application/users/GetPlatformAppUserDetail";
import { ListPlatformAppUsers } from "../../../platform/application/users/ListPlatformAppUsers";
import { ListPlatformOwners } from "../../../platform/application/owners/ListPlatformOwners";
import { GetPlatformTenantDetail } from "../../../platform/application/tenants/GetPlatformTenantDetail";
import { ListPlatformTenants } from "../../../platform/application/tenants/ListPlatformTenants";
import { UpdatePlatformTenant } from "../../../platform/application/tenants/UpdatePlatformTenant";
import { SetTenantPlatformStatus } from "../../../platform/application/tenants/SetTenantPlatformStatus";
import { PlatformCampaignTemplateRepository } from "../../../platform/domain/PlatformCampaignTemplateRepository";
import { PlatformGameRepository } from "../../../platform/domain/PlatformGameRepository";
import { PlatformAppUsersReadRepository } from "../../../platform/domain/PlatformAppUsersReadRepository";
import { PlatformAnalyticsReadRepository } from "../../../platform/domain/PlatformAnalyticsReadRepository";
import { PlatformBillingReadRepository } from "../../../platform/domain/PlatformBillingReadRepository";
import { PlatformOwnersReadRepository } from "../../../platform/domain/PlatformOwnersReadRepository";
import { PlatformDashboardReadRepository } from "../../../platform/domain/PlatformDashboardReadRepository";
import { PlatformImpersonationEventRepository } from "../../../platform/domain/PlatformImpersonationEventRepository";
import { PlatformTenantDetailReadRepository } from "../../../platform/domain/PlatformTenantDetailReadRepository";
import { PrismaPlatformCampaignTemplateRepository } from "../../../platform/infrastructure/PrismaPlatformCampaignTemplateRepository";
import { PrismaPlatformGameRepository } from "../../../platform/infrastructure/PrismaPlatformGameRepository";
import { PrismaPlatformAppUsersReadRepository } from "../../../platform/infrastructure/PrismaPlatformAppUsersReadRepository";
import { PrismaPlatformAnalyticsReadRepository } from "../../../platform/infrastructure/PrismaPlatformAnalyticsReadRepository";
import { PrismaPlatformBillingReadRepository } from "../../../platform/infrastructure/PrismaPlatformBillingReadRepository";
import { PrismaPlatformOwnersReadRepository } from "../../../platform/infrastructure/PrismaPlatformOwnersReadRepository";
import { PrismaPlatformDashboardReadRepository } from "../../../platform/infrastructure/PrismaPlatformDashboardReadRepository";
import { PrismaPlatformImpersonationEventRepository } from "../../../platform/infrastructure/PrismaPlatformImpersonationEventRepository";
import { PrismaPlatformTenantDetailReadRepository } from "../../../platform/infrastructure/PrismaPlatformTenantDetailReadRepository";
import { EnterTenantStaffFromUserSession } from "../../../tenants/memberships/application/authenticate/EnterTenantStaffFromUserSession";
import { TenantStaffLogin } from "../../../tenants/memberships/application/authenticate/TenantStaffLogin";
import { InviteTenantEmployee } from "../../../tenants/memberships/application/invite/InviteTenantEmployee";
import { ListTenantEmployees } from "../../../tenants/memberships/application/invite/ListTenantEmployees";
import { ListUserRelationships } from "../../../tenants/memberships/application/list/ListUserRelationships";
import { OwnerMembershipFinder } from "../../../tenants/memberships/application/find/OwnerMembershipFinder";
import { TenantSessionVerifier } from "../../../tenants/memberships/application/verify/TenantSessionVerifier";
import { TenantMembershipRepository } from "../../../tenants/memberships/domain/TenantMembershipRepository";
import { PrismaTenantMembershipRepository } from "../../../tenants/memberships/infrastructure/PrismaTenantMembershipRepository";
import { OwnerRegistrar } from "../../../tenants/owners/application/register/OwnerRegistrar";
import { RegisterBusinessOwnerUser } from "../../../tenants/owners/application/register/RegisterBusinessOwnerUser";
import { CreateOwnerBusiness } from "../../../tenants/owners/application/create/CreateOwnerBusiness";
import { OwnerBusinessRepository } from "../../../tenants/owners/domain/OwnerBusinessRepository";
import { OwnerOnboardingRepository } from "../../../tenants/owners/domain/OwnerOnboardingRepository";
import { PrismaOwnerBusinessRepository } from "../../../tenants/owners/infrastructure/PrismaOwnerBusinessRepository";
import { PrismaOwnerOnboardingRepository } from "../../../tenants/owners/infrastructure/PrismaOwnerOnboardingRepository";
import { TenantFinder } from "../../../tenants/tenants/application/find/TenantFinder";
import { UpdateTenantBranding } from "../../../tenants/tenants/application/update/UpdateTenantBranding";
import { ListDiscoverableEstablishments } from "../../../tenants/tenants/application/list/ListDiscoverableEstablishments";
import { UpdateTenantProfile } from "../../../tenants/tenants/application/update/UpdateTenantProfile";
import { UploadTenantCoverImage } from "../../../tenants/tenants/application/update/UploadTenantCoverImage";
import { UpdateTenantStatus } from "../../../tenants/tenants/application/update/UpdateTenantStatus";
import { TenantRepository } from "../../../tenants/tenants/domain/TenantRepository";
import { PrismaTenantRepository } from "../../../tenants/tenants/infrastructure/PrismaTenantRepository";
import { PostgresConnection } from "../postgres/PostgresConnection";

loadProjectEnv();

const builder = new ContainerBuilder();

builder
	.register(PostgresConnection)
	.useFactory(() => {
		return new PostgresConnection(
			process.env.POSTGRES_HOST ?? "localhost",
			Number(process.env.POSTGRES_PORT ?? "5432"),
			process.env.POSTGRES_USER ?? "codely",
			process.env.POSTGRES_PASSWORD ?? "c0d3ly7v",
			process.env.POSTGRES_DB ?? "postgres",
		);
	})
	.asSingleton();

builder.register(UserRepository).use(PrismaUserRepository);
builder.registerAndUse(PrismaUserRepository);

builder
	.register(GoogleIdTokenVerifier)
	.useFactory(() => {
		const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
		if (!clientId) {
			return new GoogleIdTokenVerifierGoogle("unconfigured-google-client-id");
		}

		return new GoogleIdTokenVerifierGoogle(clientId);
	})
	.asSingleton();

builder.register(TenantMembershipRepository).use(PrismaTenantMembershipRepository);
builder.registerAndUse(PrismaTenantMembershipRepository);

builder.register(OwnerOnboardingRepository).use(PrismaOwnerOnboardingRepository);
builder.registerAndUse(PrismaOwnerOnboardingRepository);

builder.register(OwnerBusinessRepository).use(PrismaOwnerBusinessRepository);
builder.registerAndUse(PrismaOwnerBusinessRepository);

builder.registerAndUse(UserRegistrar);
builder.registerAndUse(RegisterPlatformUser);
builder.registerAndUse(RegisterBusinessOwnerUser);
builder.registerAndUse(CreateOwnerBusiness);
builder.registerAndUse(OwnerRegistrar);
builder.registerAndUse(UserFinder);
builder.registerAndUse(EnsureUserQrValue);
builder.registerAndUse(UserAuthenticator);
builder.registerAndUse(AuthenticateGoogleUser);
builder.registerAndUse(LoginPlatformUser);
builder.registerAndUse(EnterPlatformUserFromTenantSession);
builder.registerAndUse(UserProfileUpdater);
builder.registerAndUse(OwnerMembershipFinder);
builder.registerAndUse(PlatformAuthenticator);
builder.register(TenantRepository).use(PrismaTenantRepository);
builder.registerAndUse(PrismaTenantRepository);
builder.registerAndUse(ListPlatformTenants);
builder.register(PlatformDashboardReadRepository).use(PrismaPlatformDashboardReadRepository);
builder.registerAndUse(PrismaPlatformDashboardReadRepository);
builder.registerAndUse(GetPlatformDashboardMetrics);
builder.register(PlatformOwnersReadRepository).use(PrismaPlatformOwnersReadRepository);
builder.registerAndUse(PrismaPlatformOwnersReadRepository);
builder.registerAndUse(ListPlatformOwners);
builder.register(PlatformAppUsersReadRepository).use(PrismaPlatformAppUsersReadRepository);
builder.registerAndUse(PrismaPlatformAppUsersReadRepository);
builder.registerAndUse(ListPlatformAppUsers);
builder.registerAndUse(GetPlatformAppUserDetail);
builder.register(PlatformCampaignTemplateRepository).use(PrismaPlatformCampaignTemplateRepository);
builder.registerAndUse(PrismaPlatformCampaignTemplateRepository);
builder.registerAndUse(ListPlatformCampaignTemplates);
builder.registerAndUse(CreatePlatformCampaignTemplate);
builder.registerAndUse(UpdatePlatformCampaignTemplate);
builder.register(PlatformGameRepository).use(PrismaPlatformGameRepository);
builder.registerAndUse(PrismaPlatformGameRepository);
builder.registerAndUse(ListPlatformGames);
builder.registerAndUse(CreatePlatformGame);
builder.registerAndUse(UpdatePlatformGame);
builder.registerAndUse(ListAvailablePlatformGamesForTenant);
builder.register(PlatformBillingReadRepository).use(PrismaPlatformBillingReadRepository);
builder.registerAndUse(PrismaPlatformBillingReadRepository);
builder.registerAndUse(GetPlatformBillingOverview);
builder.register(PlatformAnalyticsReadRepository).use(PrismaPlatformAnalyticsReadRepository);
builder.registerAndUse(PrismaPlatformAnalyticsReadRepository);
builder.registerAndUse(GetPlatformAnalyticsSummary);
builder.register(PlatformTenantDetailReadRepository).use(PrismaPlatformTenantDetailReadRepository);
builder.registerAndUse(PrismaPlatformTenantDetailReadRepository);
builder.registerAndUse(GetPlatformTenantDetail);
builder.registerAndUse(UpdatePlatformTenant);
builder.registerAndUse(AssignPlatformTenantSubscriptionPlan);
builder.register(PlatformImpersonationEventRepository).use(PrismaPlatformImpersonationEventRepository);
builder.registerAndUse(PrismaPlatformImpersonationEventRepository);
builder.registerAndUse(ImpersonateTenantOwnerFromPlatformSession);
builder.registerAndUse(EndPlatformImpersonation);
builder.registerAndUse(SetTenantPlatformStatus);
builder.registerAndUse(EnterTenantStaffFromUserSession);
builder.registerAndUse(TenantStaffLogin);
builder.registerAndUse(TenantSessionVerifier);
builder.registerAndUse(InviteTenantEmployee);
builder.registerAndUse(ListTenantEmployees);
builder.registerAndUse(ListUserRelationships);
builder.registerAndUse(TenantFinder);
builder.registerAndUse(UpdateTenantBranding);
builder.registerAndUse(ListDiscoverableEstablishments);
builder.registerAndUse(UpdateTenantProfile);
builder.registerAndUse(UploadTenantCoverImage);
builder.registerAndUse(UpdateTenantStatus);

builder.register(GooglePlaySubscriptionRepository).use(PostgresGooglePlaySubscriptionRepository);
builder.registerAndUse(PostgresGooglePlaySubscriptionRepository);
builder.registerAndUse(VerifyGooglePlayPurchase);
builder.registerAndUse(SyncUserPlanFromGooglePlay);

builder.registerAndUse(DemoPlanSetter);

builder.register(CustomerRepository).use(PrismaCustomerRepository);
builder.registerAndUse(PrismaCustomerRepository);
builder.registerAndUse(RegisterCustomer);
builder.registerAndUse(JoinTenantAsCustomer);
builder.registerAndUse(GetEstablishmentDetailForUser);
builder.registerAndUse(GetCustomerStampProgress);
builder.registerAndUse(GetTenantCustomerInsights);
builder.registerAndUse(ListTenantCustomersBySegment);
builder.registerAndUse(GetTenantCustomerDetail);
builder.registerAndUse(GetCustomerActiveRewards);
builder.registerAndUse(RedeemCustomerReward);
builder.registerAndUse(ResolveCustomerByQrForStaffScan);
builder.registerAndUse(RecordStaffScanByTarget);
builder.registerAndUse(ListStaffScanTargets);
builder.registerAndUse(RecordPromotionUse);
builder.registerAndUse(AuthenticateCustomerByQr);
builder.registerAndUse(CustomerSessionVerifier);

builder.register(LoyaltyTransactionRepository).use(PrismaLoyaltyTransactionRepository);
builder.registerAndUse(PrismaLoyaltyTransactionRepository);

builder.register(TenantCustomerAnalyticsRepository).use(PrismaTenantCustomerAnalyticsRepository);
builder.registerAndUse(PrismaTenantCustomerAnalyticsRepository);

builder.register(StampCampaignRepository).use(PrismaStampCampaignRepository);
builder.registerAndUse(PrismaStampCampaignRepository);
builder.register(StampCampaignScanStatsRepository).use(PrismaStampCampaignScanStatsRepository);
builder.registerAndUse(PrismaStampCampaignScanStatsRepository);
builder.registerAndUse(CreateStampCampaign);
builder.registerAndUse(CreateStampCampaignFromPlatformTemplate);
builder.registerAndUse(ListStampCampaigns);
builder.registerAndUse(ListStampCampaignDashboard);
builder.registerAndUse(UpdateStampCampaign);
builder.registerAndUse(DeleteStampCampaign);

builder.register(StampTypeRepository).use(PrismaStampTypeRepository);
builder.registerAndUse(PrismaStampTypeRepository);
builder.registerAndUse(CreateStampType);
builder.registerAndUse(ListStampTypes);
builder.registerAndUse(UpdateStampType);

builder.register(RewardRepository).use(PrismaRewardRepository);
builder.registerAndUse(PrismaRewardRepository);
builder.registerAndUse(CreateReward);
builder.registerAndUse(ListRewards);
builder.registerAndUse(UpdateReward);

builder.registerAndUse(ListPromotions);
builder.registerAndUse(ListActivePromotionsForCustomer);
builder.registerAndUse(ListCustomerPromotionSummaries);
builder.registerAndUse(ListUserCrossTenantPromotions);
builder.registerAndUse(CreatePromotion);
builder.registerAndUse(UpdatePromotion);

builder.register(PromotionRepository).use(PrismaPromotionRepository);
builder.registerAndUse(PrismaPromotionRepository);
builder.register(CustomerPromotionUsageRepository).use(PrismaCustomerPromotionUsageRepository);
builder.registerAndUse(PrismaCustomerPromotionUsageRepository);

builder.register(CouponRepository).use(PrismaCouponRepository);
builder.registerAndUse(PrismaCouponRepository);

builder.register(NotificationRepository).use(PrismaNotificationRepository);
builder.registerAndUse(PrismaNotificationRepository);

builder.register(TenantBillingRepository).use(PrismaTenantBillingRepository);
builder.registerAndUse(PrismaTenantBillingRepository);
builder.register(StripeCheckoutGateway).use(StripeCheckoutGatewayStripe);
builder.registerAndUse(StripeCheckoutGatewayStripe);
builder.register(StripeWebhookGateway).use(StripeWebhookGatewayStripe);
builder.registerAndUse(StripeWebhookGatewayStripe);
builder.register(StripeWebhookEventRepository).use(PrismaStripeWebhookEventRepository);
builder.registerAndUse(PrismaStripeWebhookEventRepository);
builder.registerAndUse(ListSubscriptionPlans);
builder.registerAndUse(ListPlatformSubscriptionPlans);
builder.registerAndUse(UpdateSubscriptionPlan);
builder.registerAndUse(AssignTenantSubscriptionPlan);
builder.registerAndUse(CreateStripeCheckoutSession);
builder.registerAndUse(CompleteStripeCheckoutSession);
builder.registerAndUse(SyncTenantSubscriptionFromStripe);
builder.registerAndUse(ProcessStripeWebhook);
builder.registerAndUse(ResolveTenantSubscriptionPlan);
builder.registerAndUse(ResolveTenantEffectivePlanFeatures);
builder.registerAndUse(ListPlatformPlanFeatures);
builder.registerAndUse(UpdatePlatformPlanFeatures);
builder.registerAndUse(GetPlatformTenantFeatures);
builder.registerAndUse(UpdatePlatformTenantFeatures);
builder.registerAndUse(AssertTenantPlanFeature);
builder.registerAndUse(AssertTenantEmployeeLimit);

export const container = builder.build();
