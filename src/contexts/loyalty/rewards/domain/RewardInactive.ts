import { DomainError } from "../../../shared/domain/DomainError";

export class RewardInactive extends DomainError {
	readonly type = "RewardInactive";
	readonly message: string;
	readonly rewardId: string;

	constructor(rewardId: string) {
		const message = `Reward is not active: ${rewardId}`;
		super(message);
		this.message = message;
		this.rewardId = rewardId;
	}
}
