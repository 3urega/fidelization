import { Service } from "diod";

import { SubscriptionPlan } from "../../billing/subscriptions/domain/SubscriptionPlan";
import { prisma } from "../../../lib/prisma";
import { tenantFromPrismaRow } from "../../tenants/tenants/infrastructure/tenantFromPrismaRow";
import type { PlatformTenantDetail } from "../domain/PlatformTenantDetail";
import { PlatformTenantDetailReadRepository } from "../domain/PlatformTenantDetailReadRepository";

type QrScanCountRow = {
	qr_scans_count: bigint;
};

@Service()
export class PrismaPlatformTenantDetailReadRepository extends PlatformTenantDetailReadRepository {
	async getById(tenantId: string): Promise<PlatformTenantDetail | null> {
		const tenantRow = await prisma.tenant.findUnique({ where: { id: tenantId } });

		if (!tenantRow) {
			return null;
		}

		const [ownerRows, customersCount, staffCount, qrScanRows, planRows] = await Promise.all([
			prisma.tenantMembership.findMany({
				where: { tenantId, role: "owner" },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: { user: { name: "asc" } },
			}),
			prisma.customer.count({ where: { tenantId } }),
			prisma.tenantMembership.count({ where: { tenantId } }),
			prisma.$queryRaw<QrScanCountRow[]>`
				SELECT COUNT(*) AS qr_scans_count
				FROM loyalty_transactions lt
				WHERE lt.tenant_id = ${tenantId}
				AND lt.type = 'points_earned'::"LoyaltyTransactionType"
				AND lt.metadata->>'source' = 'staff_scan'
			`,
			prisma.subscriptionPlan.findMany({
				where: { isActive: true },
				orderBy: { priceMonthly: "asc" },
			}),
		]);

		const qrScansCount = qrScanRows[0] ? Number(qrScanRows[0].qr_scans_count) : 0;

		return {
			tenant: tenantFromPrismaRow(tenantRow),
			owners: ownerRows.map((row) => ({
				userId: row.user.id,
				name: row.user.name,
				email: row.user.email,
			})),
			activity: {
				customersCount,
				staffCount,
				qrScansCount,
			},
			availablePlans: planRows.map((row) => SubscriptionPlan.fromPersistence(row)),
		};
	}
}
