import { Service } from "diod";

import { buildStripeSubscriptionDashboardUrl } from "../../../lib/billing/stripeDashboardUrl";
import { prisma } from "../../../lib/prisma";
import {
	PLATFORM_BILLING_MRR_FORMULA,
	type PlatformBillingOverview,
	type PlatformBillingSubscriptionRow,
} from "../domain/PlatformBillingOverview";
import { PlatformBillingReadRepository } from "../domain/PlatformBillingReadRepository";

@Service()
export class PrismaPlatformBillingReadRepository extends PlatformBillingReadRepository {
	async getOverview(): Promise<PlatformBillingOverview> {
		const [
			activeSubscriptions,
			pastDueCount,
			billingSuspendedTenants,
			subscriptionRows,
		] = await Promise.all([
			prisma.subscription.count({ where: { status: "active" } }),
			prisma.subscription.count({ where: { status: "past_due" } }),
			prisma.tenant.count({
				where: {
					status: "suspended",
					subscriptions: { some: { status: "past_due" } },
				},
			}),
			prisma.subscription.findMany({
				where: { status: { in: ["active", "past_due"] } },
				include: {
					tenant: { select: { id: true, slug: true, name: true, status: true } },
					plan: { select: { name: true, priceMonthly: true } },
				},
				orderBy: { startedAt: "desc" },
			}),
		]);

		const activeWithPlans = subscriptionRows.filter((row) => row.status === "active");
		const mrrCents = activeWithPlans.reduce((sum, row) => sum + row.plan.priceMonthly, 0);

		const subscriptions: PlatformBillingSubscriptionRow[] = subscriptionRows.map((row) => ({
			subscriptionId: row.id,
			tenantId: row.tenant.id,
			tenantSlug: row.tenant.slug,
			tenantName: row.tenant.name,
			tenantStatus: row.tenant.status,
			planName: row.plan.name,
			priceMonthly: row.plan.priceMonthly,
			status: row.status,
			startedAt: row.startedAt,
			endsAt: row.endsAt,
			stripeSubscriptionId: row.stripeSubscriptionId,
			stripeDashboardUrl: buildStripeSubscriptionDashboardUrl(row.stripeSubscriptionId),
		}));

		return {
			mrrCents,
			mrrFormula: PLATFORM_BILLING_MRR_FORMULA,
			activeSubscriptions,
			pastDueCount,
			billingSuspendedTenants,
			subscriptions,
			generatedAt: new Date(),
		};
	}
}
