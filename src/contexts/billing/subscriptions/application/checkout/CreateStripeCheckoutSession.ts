import { Service } from "diod";

import { resolveStripePriceId } from "../../../../../lib/billing/stripePriceIds";
import { StripeCheckoutGateway } from "../../../stripe/domain/StripeCheckoutGateway";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { FreePlanDoesNotRequireCheckout } from "../../domain/FreePlanDoesNotRequireCheckout";
import { SubscriptionPlanNotFound } from "../../domain/SubscriptionPlanNotFound";
import { TenantAlreadyHasActiveSubscription } from "../../domain/TenantAlreadyHasActiveSubscription";
import { TenantBillingForbidden } from "../../domain/TenantBillingForbidden";
import { TenantBillingRepository } from "../../domain/TenantBillingRepository";

export type CreateStripeCheckoutSessionUseCaseParams = {
	tenantId: string;
	role: TenantRole;
	planId: string;
	ownerEmail: string;
	successUrl: string;
	cancelUrl: string;
};

export type CreateStripeCheckoutSessionUseCaseResult = {
	checkoutUrl: string;
	sessionId: string;
};

@Service()
export class CreateStripeCheckoutSession {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly billingRepository: TenantBillingRepository,
		private readonly checkoutGateway: StripeCheckoutGateway,
	) {}

	async execute(
		params: CreateStripeCheckoutSessionUseCaseParams,
	): Promise<CreateStripeCheckoutSessionUseCaseResult> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantBillingForbidden(params.role);
		}

		await this.assertTenantActive(params.tenantId);

		const planId = params.planId.trim();
		if (!planId) {
			throw new Error("planId is required");
		}

		const plan = await this.billingRepository.searchPlanById(planId);
		if (!plan || !plan.isActive) {
			throw new SubscriptionPlanNotFound(planId);
		}

		if (plan.priceMonthly <= 0) {
			throw new FreePlanDoesNotRequireCheckout(planId);
		}

		const activeSubscription = await this.billingRepository.searchActiveSubscription(
			params.tenantId,
		);
		if (activeSubscription) {
			throw new TenantAlreadyHasActiveSubscription(params.tenantId);
		}

		const stripePriceId = resolveStripePriceId(plan.name);

		return await this.checkoutGateway.createCheckoutSession({
			tenantId: params.tenantId,
			planId: plan.id,
			planName: plan.name,
			stripePriceId,
			ownerEmail: params.ownerEmail,
			successUrl: params.successUrl,
			cancelUrl: params.cancelUrl,
		});
	}

	private async assertTenantActive(tenantId: string): Promise<void> {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenantId);
		}
	}
}
