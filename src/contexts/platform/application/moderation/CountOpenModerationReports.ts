import { Service } from "diod";

import { ModerationReportRepository } from "../../domain/ModerationReportRepository";

export type CountOpenModerationReportsResult = {
	openCount: number;
};

@Service()
export class CountOpenModerationReports {
	constructor(private readonly repository: ModerationReportRepository) {}

	async execute(): Promise<CountOpenModerationReportsResult> {
		const openCount = await this.repository.countOpen();

		return { openCount };
	}
}
