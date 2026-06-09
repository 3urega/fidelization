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
import { ResolveTenantSubscriptionPlan } from "../../../billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import { CreateStripeCheckoutSession } from "../../../billing/subscriptions/application/checkout/CreateStripeCheckoutSession";
import { CompleteStripeCheckoutSession } from "../../../billing/subscriptions/application/checkout/CompleteStripeCheckoutSession";
import { SyncTenantSubscriptionFromStripe } from "../../../billing/subscriptions/application/sync/SyncTenantSubscriptionFromStripe";
import { ProcessStripeWebhook } from "../../../billing/subscriptions/application/sync/ProcessStripeWebhook";
import { StripeWebhookEventRepository } from "../../../billing/stripe/domain/StripeWebhookEventRepository";
import { PrismaStripeWebhookEventRepository } from "../../../billing/stripe/infrastructure/PrismaStripeWebhookEventRepository";
import { ListSubscriptionPlans } from "../../../billing/subscriptions/application/list/ListSubscriptionPlans";
import { StripeCheckoutGateway } from "../../../billing/stripe/domain/StripeCheckoutGateway";
import { StripeWebhookGateway } from "../../../billing/stripe/domain/StripeWebhookGateway";
import { StripeCheckoutGatewayStripe } from "../../../billing/stripe/infrastructure/StripeCheckoutGatewayStripe";
import { StripeWebhookGatewayStripe } from "../../../billing/stripe/infrastructure/StripeWebhookGatewayStripe";
import { PrismaTenantBillingRepository } from "../../../billing/subscriptions/infrastructure/PrismaTenantBillingRepository";
import { UserAuthenticator } from "../../../identity/users/application/authenticate/UserAuthenticator";
import { LoginPlatformUser } from "../../../identity/users/application/authenticate/LoginPlatformUser";
import { RegisterPlatformUser } from "../../../identity/users/application/register/RegisterPlatformUser";
import { UserFinder } from "../../../identity/users/application/find/UserFinder";
import { UserRegistrar } from "../../../identity/users/application/register/UserRegistrar";
import { UserProfileUpdater } from "../../../identity/users/application/update_profile/UserProfileUpdater";
import { UserRepository } from "../../../identity/users/domain/UserRepository";
import { PrismaUserRepository } from "../../../identity/users/infrastructure/PrismaUserRepository";
import { CouponRepository } from "../../../loyalty/coupons/domain/CouponRepository";
import { PrismaCouponRepository } from "../../../loyalty/coupons/infrastructure/PrismaCouponRepository";
import { AuthenticateCustomerByQr } from "../../../loyalty/customers/application/authenticate/AuthenticateCustomerByQr";
import { GetCustomerActiveRewards } from "../../../loyalty/customers/application/profile/GetCustomerActiveRewards";
import { GetEstablishmentDetailForUser } from "../../../loyalty/customers/application/profile/GetEstablishmentDetailForUser";
import { GetCustomerStampProgress } from "../../../loyalty/customers/application/profile/GetCustomerStampProgress";
import { RedeemCustomerReward } from "../../../loyalty/customers/application/redeem/RedeemCustomerReward";
import { RecordCustomerVisitByQr } from "../../../loyalty/customers/application/scan/RecordCustomerVisitByQr";
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
import { PrismaPromotionRepository } from "../../../loyalty/promotions/infrastructure/PrismaPromotionRepository";
import { CreateReward } from "../../../loyalty/rewards/application/create/CreateReward";
import { ListRewards } from "../../../loyalty/rewards/application/list/ListRewards";
import { UpdateReward } from "../../../loyalty/rewards/application/update/UpdateReward";
import { ListActivePromotionsForCustomer } from "../../../loyalty/promotions/application/list/ListActivePromotionsForCustomer";
import { ListPromotions } from "../../../loyalty/promotions/application/list/ListPromotions";
import { CreatePromotion } from "../../../loyalty/promotions/application/create/CreatePromotion";
import { UpdatePromotion } from "../../../loyalty/promotions/application/update/UpdatePromotion";
import { RewardRepository } from "../../../loyalty/rewards/domain/RewardRepository";
import { PrismaRewardRepository } from "../../../loyalty/rewards/infrastructure/PrismaRewardRepository";
import { StampCampaignRepository } from "../../../loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { CreateStampCampaign } from "../../../loyalty/stamp_campaigns/application/create/CreateStampCampaign";
import { ListStampCampaigns } from "../../../loyalty/stamp_campaigns/application/list/ListStampCampaigns";
import { UpdateStampCampaign } from "../../../loyalty/stamp_campaigns/application/update/UpdateStampCampaign";
import { PrismaStampCampaignRepository } from "../../../loyalty/stamp_campaigns/infrastructure/PrismaStampCampaignRepository";
import { PlatformAuthenticator } from "../../../platform/application/authenticate/PlatformAuthenticator";
import { ListPlatformTenants } from "../../../platform/application/tenants/ListPlatformTenants";
import { SetTenantPlatformStatus } from "../../../platform/application/tenants/SetTenantPlatformStatus";
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
builder.registerAndUse(UserAuthenticator);
builder.registerAndUse(LoginPlatformUser);
builder.registerAndUse(UserProfileUpdater);
builder.registerAndUse(OwnerMembershipFinder);
builder.registerAndUse(PlatformAuthenticator);
builder.register(TenantRepository).use(PrismaTenantRepository);
builder.registerAndUse(PrismaTenantRepository);
builder.registerAndUse(ListPlatformTenants);
builder.registerAndUse(SetTenantPlatformStatus);
builder.registerAndUse(TenantStaffLogin);
builder.registerAndUse(TenantSessionVerifier);
builder.registerAndUse(InviteTenantEmployee);
builder.registerAndUse(ListTenantEmployees);
builder.registerAndUse(ListUserRelationships);
builder.registerAndUse(TenantFinder);
builder.registerAndUse(UpdateTenantBranding);
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
builder.registerAndUse(GetCustomerActiveRewards);
builder.registerAndUse(RedeemCustomerReward);
builder.registerAndUse(RecordCustomerVisitByQr);
builder.registerAndUse(AuthenticateCustomerByQr);
builder.registerAndUse(CustomerSessionVerifier);

builder.register(LoyaltyTransactionRepository).use(PrismaLoyaltyTransactionRepository);
builder.registerAndUse(PrismaLoyaltyTransactionRepository);

builder.register(StampCampaignRepository).use(PrismaStampCampaignRepository);
builder.registerAndUse(PrismaStampCampaignRepository);
builder.registerAndUse(CreateStampCampaign);
builder.registerAndUse(ListStampCampaigns);
builder.registerAndUse(UpdateStampCampaign);

builder.register(RewardRepository).use(PrismaRewardRepository);
builder.registerAndUse(PrismaRewardRepository);
builder.registerAndUse(CreateReward);
builder.registerAndUse(ListRewards);
builder.registerAndUse(UpdateReward);

builder.registerAndUse(ListPromotions);
builder.registerAndUse(ListActivePromotionsForCustomer);
builder.registerAndUse(CreatePromotion);
builder.registerAndUse(UpdatePromotion);

builder.register(PromotionRepository).use(PrismaPromotionRepository);
builder.registerAndUse(PrismaPromotionRepository);

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
builder.registerAndUse(AssignTenantSubscriptionPlan);
builder.registerAndUse(CreateStripeCheckoutSession);
builder.registerAndUse(CompleteStripeCheckoutSession);
builder.registerAndUse(SyncTenantSubscriptionFromStripe);
builder.registerAndUse(ProcessStripeWebhook);
builder.registerAndUse(ResolveTenantSubscriptionPlan);
builder.registerAndUse(AssertTenantPlanFeature);
builder.registerAndUse(AssertTenantEmployeeLimit);

export const container = builder.build();
