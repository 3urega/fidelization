import { Service } from "diod";

import { ModerationReport } from "../../domain/ModerationReport";
import { ModerationReportAlreadyResolved } from "../../domain/ModerationReportAlreadyResolved";
import { ModerationReportNotFound } from "../../domain/ModerationReportNotFound";
import { ModerationReportRepository } from "../../domain/ModerationReportRepository";

export type ResolveModerationReportParams = {
	reportId: string;
	resolvedByUserId: string;
};

@Service()
export class ResolveModerationReport {
	constructor(private readonly repository: ModerationReportRepository) {}

	async execute(params: ResolveModerationReportParams): Promise<ModerationReport> {
		const existing = await this.repository.findById(params.reportId);

		if (!existing) {
			throw new ModerationReportNotFound(params.reportId);
		}

		if (!existing.isOpen()) {
			throw new ModerationReportAlreadyResolved(params.reportId);
		}

		const resolved = existing.resolve(params.resolvedByUserId, new Date());
		await this.repository.save(resolved);

		return resolved;
	}
}
