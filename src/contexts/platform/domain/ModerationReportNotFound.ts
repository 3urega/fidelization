import { DomainError } from "../../shared/domain/DomainError";

export class ModerationReportNotFound extends DomainError {
	readonly type = "ModerationReportNotFound";
	readonly message: string;

	constructor(reportId: string) {
		super(`Moderation report not found: ${reportId}`);
		this.message = `Moderation report not found: ${reportId}`;
	}
}
