import { Service } from "diod";

import { Prisma } from "../../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { SubscriptionPlan } from "../domain/SubscriptionPlan";
import { TenantBillingRepository } from "../domain/TenantBillingRepository";
import { SubscriptionStatus, TenantSubscription } from "../domain/TenantSubscription";

@Service()
export class PrismaTenantBillingRepository extends TenantBillingRepository {
	async savePlan(plan: SubscriptionPlan): Promise<void> {
		const p = plan.toPrimitives();
		const limits =
			p.limits === null ? Prisma.JsonNull : (p.limits as Prisma.InputJsonValue);

		await prisma.subscriptionPlan.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				name: p.name,
				priceMonthly: p.priceMonthly,
				priceYearly: p.priceYearly,
				features: p.features,
				limits,
				isActive: p.isActive,
			},
			update: {
				name: p.name,
				priceMonthly: p.priceMonthly,
				priceYearly: p.priceYearly,
				features: p.features,
				limits,
				isActive: p.isActive,
			},
		});
	}

	async searchPlanByName(name: string): Promise<SubscriptionPlan | null> {
		const row = await prisma.subscriptionPlan.findUnique({ where: { name } });

		return row ? SubscriptionPlan.fromPersistence(row) : null;
	}

	async searchPlanById(planId: string): Promise<SubscriptionPlan | null> {
		const row = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

		return row ? SubscriptionPlan.fromPersistence(row) : null;
	}

	async listActivePlans(): Promise<SubscriptionPlan[]> {
		const rows = await prisma.subscriptionPlan.findMany({
			where: { isActive: true },
			orderBy: { priceMonthly: "asc" },
		});

		return rows.map((row) => SubscriptionPlan.fromPersistence(row));
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
		const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
		if (!plan) {
			throw new Error(`Subscription plan ${planId} not found`);
		}

		await prisma.tenant.update({
			where: { id: tenantId },
			data: {
				subscriptionPlanId: planId,
				subscriptionPlan: plan.name,
			},
		});
	}
}
