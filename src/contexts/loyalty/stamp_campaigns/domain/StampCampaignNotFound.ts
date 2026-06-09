import { DomainError } from "../../../shared/domain/DomainError";

export class StampCampaignNotFound extends DomainError {
	readonly type = "StampCampaignNotFound";
	readonly message: string;
	readonly campaignId: string;

	constructor(campaignId: string) {
		const message = `Stamp campaign not found: ${campaignId}`;
		super(message);
		this.message = message;
		this.campaignId = campaignId;
	}
}
