import { Service } from "diod";

import { AssertTenantPlanFeature } from "../../../../billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { TenantRole } from "../../../../tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../../../../tenants/tenants/domain/TenantAccessSuspended";
import { TenantNotFound } from "../../../../tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../../../../tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../../../../tenants/tenants/domain/TenantStatus";
import { resolveRouletteActivityDayWindow } from "../../../../../lib/roulette/parseRouletteActivityDateQuery";
import type { RouletteActivitySpinRow } from "../../domain/RouletteActivityRead";
import { RouletteConfigForbidden } from "../../domain/RouletteConfigForbidden";
import { InvalidRouletteActivityDate } from "../../domain/InvalidRouletteActivityDate";
import { RouletteSpinRepository } from "../../domain/RouletteSpinRepository";

export type ListRouletteActivitySpinsParams = {
	tenantId: string;
	role: TenantRole;
	segmentId: string;
	dateQuery?: string | null;
	referenceDate?: Date;
};

export type ListRouletteActivitySpinsResult = {
	date: string;
	timezone: string;
	segmentId: string;
	spins: RouletteActivitySpinRow[];
};

@Service()
export class ListRouletteActivitySpins {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly assertTenantPlanFeature: AssertTenantPlanFeature,
		private readonly spinRepository: RouletteSpinRepository,
	) {}

	async execute(params: ListRouletteActivitySpinsParams): Promise<ListRouletteActivitySpinsResult> {
		if (params.role !== TenantRole.Owner) {
			throw new RouletteConfigForbidden(params.role);
		}

		await this.assertTenantAllowsLoyalty(params.tenantId);
		await this.assertTenantPlanFeature.execute({
			tenantId: params.tenantId,
			feature: "gamification",
		});

		const segmentId = params.segmentId.trim();

		if (!segmentId) {
			throw new InvalidRouletteActivityDate("segmentId is required");
		}

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
			{ segmentId },
		);

		const spins: RouletteActivitySpinRow[] = rows.map((row) => ({
			spinId: row.spinId,
			customerId: row.customerId,
			customerName: row.customerName,
			segmentId: row.segmentId,
			segmentLabel: row.segmentLabel,
			prizeType: row.prizeType,
			status: row.status,
			createdAt: row.createdAt,
			redeemedAt: row.redeemedAt,
		}));

		return {
			date: window.calendarDate,
			timezone: window.timezone,
			segmentId,
			spins,
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
