import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import {
	emptyStampCampaignScanCounts,
	type StampCampaignScanCounts,
} from "../domain/StampCampaignScanCounts";
import {
	CountScansForActiveCampaignsParams,
	StampCampaignScanStatsRepository,
} from "../domain/StampCampaignScanStatsRepository";

type ScanStatsRow = {
	campaign_id: string;
	today: bigint;
	yesterday: bigint;
	last7_days: bigint;
	since_start: bigint;
};

function toCount(value: bigint): number {
	return Number(value);
}

@Service()
export class PrismaStampCampaignScanStatsRepository extends StampCampaignScanStatsRepository {
	async countScansForActiveCampaigns(
		params: CountScansForActiveCampaignsParams,
	): Promise<Map<string, StampCampaignScanCounts>> {
		if (params.campaigns.length === 0) {
			return new Map();
		}

		const { tenantId, windows } = params;
		const rows = await prisma.$queryRaw<ScanStatsRow[]>`
			SELECT
				c.id AS campaign_id,
				COUNT(*) FILTER (
					WHERE lt.created_at >= ${windows.today.start}
					AND lt.created_at < ${windows.today.end}
				) AS today,
				COUNT(*) FILTER (
					WHERE lt.created_at >= ${windows.yesterday.start}
					AND lt.created_at < ${windows.yesterday.end}
				) AS yesterday,
				COUNT(*) FILTER (
					WHERE lt.created_at >= ${windows.last7Days.start}
					AND lt.created_at < ${windows.last7Days.end}
				) AS last7_days,
				COUNT(*) FILTER (
					WHERE lt.created_at >= c.created_at
				) AS since_start
			FROM stamp_campaigns c
			LEFT JOIN loyalty_transactions lt
				ON lt.tenant_id = c.tenant_id
				AND lt.type = 'stamp_added'::"LoyaltyTransactionType"
				AND lt.metadata->>'campaignId' = c.id::text
			WHERE c.tenant_id = ${tenantId}::uuid
				AND c.is_active = true
			GROUP BY c.id, c.created_at
		`;

		const countsByCampaignId = new Map<string, StampCampaignScanCounts>();

		for (const row of rows) {
			countsByCampaignId.set(row.campaign_id, {
				today: toCount(row.today),
				yesterday: toCount(row.yesterday),
				last7Days: toCount(row.last7_days),
				sinceStart: toCount(row.since_start),
			});
		}

		for (const campaign of params.campaigns) {
			if (!countsByCampaignId.has(campaign.id)) {
				countsByCampaignId.set(campaign.id, emptyStampCampaignScanCounts());
			}
		}

		return countsByCampaignId;
	}
}
