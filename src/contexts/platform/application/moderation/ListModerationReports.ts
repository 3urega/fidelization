import { Service } from "diod";

import {
	ModerationReportRepository,
	type ModerationReportListPage,
} from "../../domain/ModerationReportRepository";
import { type ModerationReportStatus } from "../../domain/ModerationReportTypes";

export type ListModerationReportsParams = {
	status?: ModerationReportStatus;
	limit?: number;
	offset?: number;
};

@Service()
export class ListModerationReports {
	constructor(private readonly repository: ModerationReportRepository) {}

	async execute(params: ListModerationReportsParams = {}): Promise<ModerationReportListPage> {
		return this.repository.list({
			status: params.status,
			limit: params.limit ?? 20,
			offset: params.offset ?? 0,
		});
	}
}
