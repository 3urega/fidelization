import { DomainError } from "../../shared/domain/DomainError";

export class InvalidPlatformCampaignTemplate extends DomainError {
	readonly type = "InvalidPlatformCampaignTemplate";
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.message = message;
	}
}
