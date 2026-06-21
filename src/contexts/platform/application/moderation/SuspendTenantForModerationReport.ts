import { Service } from "diod";

import { Tenant } from "../../../tenants/tenants/domain/Tenant";
import { TenantStatus } from "../../../tenants/tenants/domain/TenantStatus";
import { SetTenantPlatformStatus } from "../tenants/SetTenantPlatformStatus";
import { InvalidModerationReport } from "../../domain/InvalidModerationReport";
import { ModerationReport } from "../../domain/ModerationReport";
import { ModerationReportAlreadyResolved } from "../../domain/ModerationReportAlreadyResolved";
import { ModerationReportNotFound } from "../../domain/ModerationReportNotFound";
import { ModerationReportRepository } from "../../domain/ModerationReportRepository";
import { ModerationReportTargetResolver } from "../../domain/ModerationReportTargetResolver";

export type SuspendTenantForModerationReportParams = {
	reportId: string;
	resolvedByUserId: string;
};

export type SuspendTenantForModerationReportResult = {
	report: ModerationReport;
	tenant: Tenant;
};

@Service()
export class SuspendTenantForModerationReport {
	constructor(
		private readonly repository: ModerationReportRepository,
		private readonly targetResolver: ModerationReportTargetResolver,
		private readonly setTenantPlatformStatus: SetTenantPlatformStatus,
	) {}

	async execute(
		params: SuspendTenantForModerationReportParams,
	): Promise<SuspendTenantForModerationReportResult> {
		const existing = await this.repository.findById(params.reportId);

		if (!existing) {
			throw new ModerationReportNotFound(params.reportId);
		}

		if (!existing.isOpen()) {
			throw new ModerationReportAlreadyResolved(params.reportId);
		}

		const primitives = existing.toPrimitives();
		const targetContext = await this.targetResolver.resolve(
			primitives.targetType,
			primitives.targetId,
		);

		if (!targetContext) {
			throw new InvalidModerationReport("Report target not found");
		}

		const tenant = await this.setTenantPlatformStatus.execute(
			targetContext.tenantId,
			TenantStatus.Suspended,
		);

		const resolved = existing.resolve(params.resolvedByUserId, new Date());
		await this.repository.save(resolved);

		return {
			report: resolved,
			tenant,
		};
	}
}
