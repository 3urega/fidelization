import { DomainError } from "../../../shared/domain/DomainError";

export class StampCampaignForbidden extends DomainError {
	readonly type = "StampCampaignForbidden";
	readonly message: string;
	readonly role: string;

	constructor(role: string) {
		const message = "Only the business owner can manage stamp campaigns";
		super(message);
		this.message = message;
		this.role = role;
	}
}
