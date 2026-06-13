import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { GENERIC_STAMP_VISIT_LABEL } from "../../stamp_types/domain/StampType";
import type { CustomerActivityRow, CustomerRedeemedRewardRow } from "../domain/analytics/CustomerDetail";
import type { CustomerAnalyticsRawRow } from "../domain/analytics/CustomerAnalyticsRawRow";
import type { CustomerNearRewardProgress } from "../domain/analytics/CustomerNearRewardProgress";
import {
	LoadCustomerAnalyticsSnapshotParams,
	TenantCustomerAnalyticsRepository,
} from "../domain/analytics/TenantCustomerAnalyticsRepository";

type SnapshotRow = {
	customer_id: string;
	name: string;
	email: string | null;
	phone: string | null;
	created_at: Date;
	visits_count: number;
	points_balance: number;
	last_visit_at: Date | null;
	visits_this_month: bigint;
	total_stamps: bigint;
	rewards_redeemed_count: bigint;
};

type NearRewardRow = {
	customer_id: string;
	campaign_id: string;
	campaign_name: string;
	current: number;
	required: number;
};

type ActivityRow = {
	created_at: Date;
	type: string;
	stamp_type_label: string | null;
};

type RedeemedRow = {
	created_at: Date;
	reward_name: string | null;
};

function toCount(value: bigint): number {
	return Number(value);
}

function mapSnapshotRow(row: SnapshotRow): CustomerAnalyticsRawRow {
	return {
		customerId: row.customer_id,
		name: row.name,
		email: row.email,
		phone: row.phone,
		createdAt: row.created_at,
		visitsCount: row.visits_count,
		pointsBalance: row.points_balance,
		lastVisitAt: row.last_visit_at,
		visitsThisMonth: toCount(row.visits_this_month),
		totalStamps: toCount(row.total_stamps),
		rewardsRedeemedCount: toCount(row.rewards_redeemed_count),
		nearRewardCampaigns: [],
	};
}

function dedupeActivityRows(rows: ActivityRow[]): CustomerActivityRow[] {
	const bySecond = new Map<number, CustomerActivityRow>();

	for (const row of rows) {
		const secondKey = Math.floor(row.created_at.getTime() / 1000);
		const label =
			row.type === "stamp_added"
				? (row.stamp_type_label ?? GENERIC_STAMP_VISIT_LABEL)
				: GENERIC_STAMP_VISIT_LABEL;
		const existing = bySecond.get(secondKey);

		if (!existing) {
			bySecond.set(secondKey, { occurredAt: row.created_at, label });
			continue;
		}

		if (row.type === "stamp_added" && existing.label === GENERIC_STAMP_VISIT_LABEL) {
			bySecond.set(secondKey, { occurredAt: row.created_at, label });
		}
	}

	return Array.from(bySecond.values())
		.sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
		.slice(0, 20);
}

@Service()
export class PrismaTenantCustomerAnalyticsRepository extends TenantCustomerAnalyticsRepository {
	async loadSnapshot(params: LoadCustomerAnalyticsSnapshotParams): Promise<CustomerAnalyticsRawRow[]> {
		const rows = await prisma.$queryRaw<SnapshotRow[]>`
			SELECT
				c.id AS customer_id,
				c.name,
				c.email,
				c.phone,
				c.created_at,
				c.visits_count,
				c.points_balance,
				lv.last_visit_at,
				COALESCE(mv.visits_this_month, 0) AS visits_this_month,
				COALESCE(st.total_stamps, 0) AS total_stamps,
				COALESCE(rr.rewards_redeemed_count, 0) AS rewards_redeemed_count
			FROM customers c
			LEFT JOIN (
				SELECT customer_id, MAX(created_at) AS last_visit_at
				FROM loyalty_transactions
				WHERE tenant_id = ${params.tenantId}
					AND type IN (
						'points_earned'::"LoyaltyTransactionType",
						'stamp_added'::"LoyaltyTransactionType"
					)
				GROUP BY customer_id
			) lv ON lv.customer_id = c.id
			LEFT JOIN (
				SELECT customer_id, COUNT(*) AS visits_this_month
				FROM loyalty_transactions
				WHERE tenant_id = ${params.tenantId}
					AND type = 'points_earned'::"LoyaltyTransactionType"
					AND created_at >= ${params.monthStart}
					AND created_at < ${params.monthEnd}
				GROUP BY customer_id
			) mv ON mv.customer_id = c.id
			LEFT JOIN (
				SELECT customer_id, SUM(current_stamps) AS total_stamps
				FROM customer_stamp_progress
				WHERE tenant_id = ${params.tenantId}
				GROUP BY customer_id
			) st ON st.customer_id = c.id
			LEFT JOIN (
				SELECT customer_id, COUNT(*) AS rewards_redeemed_count
				FROM loyalty_transactions
				WHERE tenant_id = ${params.tenantId}
					AND type = 'reward_redeemed'::"LoyaltyTransactionType"
				GROUP BY customer_id
			) rr ON rr.customer_id = c.id
			WHERE c.tenant_id = ${params.tenantId}
			ORDER BY c.name ASC
		`;

		return rows.map(mapSnapshotRow);
	}

	async loadNearRewardByTenant(
		tenantId: string,
	): Promise<Map<string, CustomerNearRewardProgress[]>> {
		const rows = await prisma.$queryRaw<NearRewardRow[]>`
			SELECT
				csp.customer_id,
				sc.id AS campaign_id,
				sc.name AS campaign_name,
				csp.current_stamps AS current,
				sc.required_stamps AS required
			FROM customer_stamp_progress csp
			INNER JOIN stamp_campaigns sc ON sc.id = csp.campaign_id
			WHERE csp.tenant_id = ${tenantId}
				AND sc.is_active = true
				AND csp.completed = false
				AND csp.current_stamps >= sc.required_stamps - 1
				AND csp.current_stamps < sc.required_stamps
		`;

		const byCustomerId = new Map<string, CustomerNearRewardProgress[]>();

		for (const row of rows) {
			const progress: CustomerNearRewardProgress = {
				campaignId: row.campaign_id,
				campaignName: row.campaign_name,
				current: row.current,
				required: row.required,
			};
			const existing = byCustomerId.get(row.customer_id) ?? [];
			existing.push(progress);
			byCustomerId.set(row.customer_id, existing);
		}

		return byCustomerId;
	}

	async findCustomerBase(
		tenantId: string,
		customerId: string,
	): Promise<CustomerAnalyticsRawRow | null> {
		const rows = await prisma.$queryRaw<SnapshotRow[]>`
			SELECT
				c.id AS customer_id,
				c.name,
				c.email,
				c.phone,
				c.created_at,
				c.visits_count,
				c.points_balance,
				lv.last_visit_at,
				0 AS visits_this_month,
				COALESCE(st.total_stamps, 0) AS total_stamps,
				COALESCE(rr.rewards_redeemed_count, 0) AS rewards_redeemed_count
			FROM customers c
			LEFT JOIN (
				SELECT customer_id, MAX(created_at) AS last_visit_at
				FROM loyalty_transactions
				WHERE tenant_id = ${tenantId}
					AND customer_id = ${customerId}
					AND type IN (
						'points_earned'::"LoyaltyTransactionType",
						'stamp_added'::"LoyaltyTransactionType"
					)
				GROUP BY customer_id
			) lv ON lv.customer_id = c.id
			LEFT JOIN (
				SELECT customer_id, SUM(current_stamps) AS total_stamps
				FROM customer_stamp_progress
				WHERE tenant_id = ${tenantId}
					AND customer_id = ${customerId}
				GROUP BY customer_id
			) st ON st.customer_id = c.id
			LEFT JOIN (
				SELECT customer_id, COUNT(*) AS rewards_redeemed_count
				FROM loyalty_transactions
				WHERE tenant_id = ${tenantId}
					AND customer_id = ${customerId}
					AND type = 'reward_redeemed'::"LoyaltyTransactionType"
				GROUP BY customer_id
			) rr ON rr.customer_id = c.id
			WHERE c.tenant_id = ${tenantId}
				AND c.id = ${customerId}
			LIMIT 1
		`;

		const row = rows[0];
		return row ? mapSnapshotRow(row) : null;
	}

	async loadRecentActivity(
		tenantId: string,
		customerId: string,
		limit: number,
	): Promise<CustomerActivityRow[]> {
		const rows = await prisma.$queryRaw<ActivityRow[]>`
			SELECT
				lt.created_at,
				lt.type::text AS type,
				lt.metadata->>'stampTypeLabel' AS stamp_type_label
			FROM loyalty_transactions lt
			WHERE lt.tenant_id = ${tenantId}
				AND lt.customer_id = ${customerId}
				AND lt.type IN (
					'points_earned'::"LoyaltyTransactionType",
					'stamp_added'::"LoyaltyTransactionType"
				)
			ORDER BY lt.created_at DESC
			LIMIT ${limit * 2}
		`;

		return dedupeActivityRows(rows);
	}

	async loadRewardsRedeemed(
		tenantId: string,
		customerId: string,
	): Promise<CustomerRedeemedRewardRow[]> {
		const rows = await prisma.$queryRaw<RedeemedRow[]>`
			SELECT
				lt.created_at,
				lt.metadata->>'rewardName' AS reward_name
			FROM loyalty_transactions lt
			WHERE lt.tenant_id = ${tenantId}
				AND lt.customer_id = ${customerId}
				AND lt.type = 'reward_redeemed'::"LoyaltyTransactionType"
			ORDER BY lt.created_at DESC
		`;

		return rows.map((row) => ({
			redeemedAt: row.created_at,
			rewardName: row.reward_name ?? "Recompensa",
		}));
	}
}
