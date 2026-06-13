import { DomainError } from "../../../shared/domain/DomainError";

export class PlatformCampaignTemplateNotFound extends DomainError {
	readonly type = "PlatformCampaignTemplateNotFound";
	readonly message: string;

	constructor(public readonly id: string) {
		const message = `Platform campaign template ${id} not found`;
		super(message);
		this.message = message;
	}
}
