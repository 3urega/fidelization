import { DomainError } from "../../../shared/domain/DomainError";

export class PromotionUsageLimitReached extends DomainError {
	readonly type = "PromotionUsageLimitReached";
	readonly message: string;
	readonly promotionId: string;
	readonly maxUsesPerUser: number;

	constructor(promotionId: string, maxUsesPerUser: number) {
		const message = `Promotion ${promotionId} usage limit reached (${maxUsesPerUser} per customer)`;
		super(message);
		this.message = message;
		this.promotionId = promotionId;
		this.maxUsesPerUser = maxUsesPerUser;
	}
}
