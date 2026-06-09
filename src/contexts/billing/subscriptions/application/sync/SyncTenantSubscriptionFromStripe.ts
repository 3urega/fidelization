import { Service } from "diod";

import { UpdateTenantStatus } from "../../../../tenants/tenants/application/update/UpdateTenantStatus";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { StripeSubscriptionNotFound } from "../../domain/StripeSubscriptionNotFound";
import { TenantBillingRepository } from "../../domain/TenantBillingRepository";
import { SubscriptionStatus } from "../../domain/TenantSubscription";

export type SyncTenantSubscriptionFromStripeParams = {
	stripeSubscriptionId: string;
	stripeStatus: string;
};

export type SyncTenantSubscriptionFromStripeResult = {
	tenantId: string;
	subscriptionStatus: SubscriptionStatus;
	tenantStatus: TenantStatus;
	changed: boolean;
};

@Service()
export class SyncTenantSubscriptionFromStripe {
	constructor(
		private readonly billingRepository: TenantBillingRepository,
		private readonly tenantRepository: TenantRepository,
		private readonly updateTenantStatus: UpdateTenantStatus,
	) {}

	async execute(
		params: SyncTenantSubscriptionFromStripeParams,
	): Promise<SyncTenantSubscriptionFromStripeResult> {
		const stripeSubscriptionId = params.stripeSubscriptionId.trim();
		const stripeStatus = params.stripeStatus.trim().toLowerCase();

		if (!stripeSubscriptionId) {
			throw new Error("stripeSubscriptionId is required");
		}

		const subscription =
			await this.billingRepository.searchSubscriptionByStripeId(stripeSubscriptionId);
		if (!subscription) {
			throw new StripeSubscriptionNotFound(stripeSubscriptionId);
		}

		const tenant = await this.requireTenant(subscription.tenantId);
		const previousSubscriptionStatus = subscription.status;

		if (previousSubscriptionStatus === "canceled") {
			return this.result(tenant, "canceled", false);
		}

		if (stripeStatus === "active") {
			if (previousSubscriptionStatus !== "past_due") {
				return this.result(tenant, previousSubscriptionStatus, false);
			}

			await this.billingRepository.updateSubscriptionStatus(subscription.id, "active");
			const updatedTenant = await this.updateTenantStatus.execute(
				subscription.tenantId,
				TenantStatus.Active,
			);

			return this.result(updatedTenant, "active", true);
		}

		if (this.shouldSuspend(stripeStatus)) {
			const nextSubscriptionStatus = this.mapSuspendSubscriptionStatus(stripeStatus);
			let changed = false;

			if (previousSubscriptionStatus !== nextSubscriptionStatus) {
				await this.billingRepository.updateSubscriptionStatus(
					subscription.id,
					nextSubscriptionStatus,
				);
				changed = true;
			}

			if (tenant.status !== TenantStatus.Suspended) {
				await this.updateTenantStatus.execute(subscription.tenantId, TenantStatus.Suspended);
				changed = true;
			}

			const updatedTenant = await this.requireTenant(subscription.tenantId);

			return this.result(updatedTenant, nextSubscriptionStatus, changed);
		}

		return this.result(tenant, previousSubscriptionStatus, false);
	}

	private async requireTenant(tenantId: string) {
		const tenant = await this.tenantRepository.findById(tenantId);
		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		return tenant;
	}

	private shouldSuspend(stripeStatus: string): boolean {
		return (
			stripeStatus === "past_due" ||
			stripeStatus === "unpaid" ||
			stripeStatus === "canceled" ||
			stripeStatus === "incomplete_expired"
		);
	}

	private mapSuspendSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
		if (stripeStatus === "canceled" || stripeStatus === "incomplete_expired") {
			return "canceled";
		}

		return "past_due";
	}

	private result(
		tenant: { id: string; status: TenantStatus },
		subscriptionStatus: SubscriptionStatus,
		changed: boolean,
	): SyncTenantSubscriptionFromStripeResult {
		return {
			tenantId: tenant.id,
			subscriptionStatus,
			tenantStatus: tenant.status,
			changed,
		};
	}
}
