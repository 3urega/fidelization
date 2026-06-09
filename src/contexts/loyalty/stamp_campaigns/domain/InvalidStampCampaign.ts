import { DomainError } from "../../../shared/domain/DomainError";

export class InvalidStampCampaign extends DomainError {
	readonly type = "InvalidStampCampaign";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
