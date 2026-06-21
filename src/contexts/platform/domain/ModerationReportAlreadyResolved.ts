import { DomainError } from "../../shared/domain/DomainError";

export class ModerationReportAlreadyResolved extends DomainError {
	readonly type = "ModerationReportAlreadyResolved";
	readonly message: string;

	constructor(reportId: string) {
		super(`Moderation report already resolved: ${reportId}`);
		this.message = `Moderation report already resolved: ${reportId}`;
	}
}
