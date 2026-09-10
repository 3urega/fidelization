import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { resolveRouletteActivityDayWindow } from "../../../../../lib/roulette/parseRouletteActivityDateQuery";
import type { RouletteActivityPrizeSummary } from "../../domain/RouletteActivityRead";
import { RouletteConfigForbidden } from "../../domain/RouletteConfigForbidden";
import { InvalidRouletteActivityDate } from "../../domain/InvalidRouletteActivityDate";
import { RouletteSpinRepository } from "../../domain/RouletteSpinRepository";

export type GetRouletteActivitySummaryParams = {
	tenantId: string;
	role: TenantRole;
	dateQuery?: string | null;
	referenceDate?: Date;
};

export type GetRouletteActivitySummaryResult = {
	date: string;
	timezone: string;
	totalSpins: number;
	prizes: RouletteActivityPrizeSummary[];
	generatedAt: Date;
};

@Service()
export class GetRouletteActivitySummary {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly spinRepository: RouletteSpinRepository,
	) {}

	async execute(
		params: GetRouletteActivitySummaryParams,
	): Promise<GetRouletteActivitySummaryResult> {
		if (params.role !== TenantRole.Owner) {
			throw new RouletteConfigForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "gamification",
		});

		const window = resolveRouletteActivityDayWindow({
			dateQuery: params.dateQuery,
			referenceDate: params.referenceDate,
		});

		if ("error" in window) {
			throw new InvalidRouletteActivityDate(window.error);
		}

		const rows = await this.spinRepository.listByTenantBetween(
			params.tenantId,
			window.start,
			window.end,
		);

		const prizeMap = new Map<
			string,
			{ label: string; spinCount: number; customerIds: Set<string> }
		>();

		for (const row of rows) {
			if (row.prizeType === "none") {
				continue;
			}

			const existing = prizeMap.get(row.segmentId);

			if (existing) {
				existing.spinCount += 1;
				existing.customerIds.add(row.customerId);
			} else {
				prizeMap.set(row.segmentId, {
					label: row.segmentLabel,
					spinCount: 1,
					customerIds: new Set([row.customerId]),
				});
			}
		}

		const prizes: RouletteActivityPrizeSummary[] = [...prizeMap.entries()]
			.map(([segmentId, aggregate]) => ({
				segmentId,
				label: aggregate.label,
				spinCount: aggregate.spinCount,
				distinctCustomers: aggregate.customerIds.size,
			}))
			.sort((a, b) => b.spinCount - a.spinCount || a.label.localeCompare(b.label, "es"));

		return {
			date: window.calendarDate,
			timezone: window.timezone,
			totalSpins: rows.length,
			prizes,
			generatedAt: params.referenceDate ?? new Date(),
		};
	}

	private async assertTenantAllowsLoyalty(tenantId: string): Promise<void> {
		const tenant = await this.tenantRepository.findById(tenantId);

		if (!tenant) {
			throw new TenantNotFound(tenantId);
		}

		if (tenant.status === TenantStatus.Suspended) {
			throw new TenantAccessSuspended(tenantId);
		}
	}
}
