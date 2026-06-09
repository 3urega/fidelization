import { DomainError } from "../../../shared/domain/DomainError";

export class RewardNotFound extends DomainError {
	readonly type = "RewardNotFound";
	readonly message: string;
	readonly rewardId: string;

	constructor(rewardId: string) {
		const message = `Reward not found: ${rewardId}`;
		super(message);
		this.message = message;
		this.rewardId = rewardId;
	}
}
