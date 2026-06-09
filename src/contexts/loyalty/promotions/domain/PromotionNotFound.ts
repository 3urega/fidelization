import { DomainError } from "../../../shared/domain/DomainError";

export class PromotionNotFound extends DomainError {
	readonly type = "PromotionNotFound";
	readonly message: string;
	readonly promotionId: string;

	constructor(promotionId: string) {
		const message = `Promotion not found: ${promotionId}`;
		super(message);
		this.message = message;
		this.promotionId = promotionId;
	}
}
