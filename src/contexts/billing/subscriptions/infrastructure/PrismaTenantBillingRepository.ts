import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { SubscriptionPlan } from "../domain/SubscriptionPlan";
import { TenantBillingRepository } from "../domain/TenantBillingRepository";
import { SubscriptionStatus, TenantSubscription } from "../domain/TenantSubscription";

@Service()
export class PrismaTenantBillingRepository extends TenantBillingRepository {
	async savePlan(plan: SubscriptionPlan): Promise<void> {
		const p = plan.toPrimitives();

		await prisma.subscriptionPlan.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				name: p.name,
				priceMonthly: p.priceMonthly,
				priceYearly: p.priceYearly,
				isActive: p.isActive,
			},
			update: {
				name: p.name,
				priceMonthly: p.priceMonthly,
				priceYearly: p.priceYearly,
				isActive: p.isActive,
			},
		});
	}

	async searchPlanByName(name: string): Promise<SubscriptionPlan | null> {
		const row = await prisma.subscriptionPlan.findUnique({ where: { name } });

		return row
			? SubscriptionPlan.fromPrimitives({
					id: row.id,
					name: row.name,
					priceMonthly: row.priceMonthly,
					priceYearly: row.priceYearly,
					isActive: row.isActive,
				})
			: null;
	}

	async saveSubscription(subscription: TenantSubscription): Promise<void> {
		const p = subscription.toPrimitives();

		await prisma.subscription.create({
			data: {
				id: p.id,
				tenantId: p.tenantId,
				planId: p.planId,
				status: p.status,
			},
		});
	}

	async searchActiveSubscription(tenantId: string): Promise<TenantSubscription | null> {
		const row = await prisma.subscription.findFirst({
			where: { tenantId, status: "active" },
			orderBy: { startedAt: "desc" },
		});

		return row
			? TenantSubscription.fromPrimitives({
					id: row.id,
					tenantId: row.tenantId,
					planId: row.planId,
					status: row.status as SubscriptionStatus,
				})
			: null;
	}

	async linkTenantPlan(tenantId: string, planId: string): Promise<void> {
		await prisma.tenant.update({
			where: { id: tenantId },
			data: { subscriptionPlanId: planId },
		});
	}
}
