import { DomainError } from "../../../shared/domain/DomainError";

export class StampCampaignActiveCannotBeDeleted extends DomainError {
	readonly type = "StampCampaignActiveCannotBeDeleted";
	readonly message: string;
	readonly campaignId: string;

	constructor(campaignId: string) {
		const message = `Stamp campaign ${campaignId} must be deactivated before deletion`;
		super(message);
		this.message = message;
		this.campaignId = campaignId;
	}
}
