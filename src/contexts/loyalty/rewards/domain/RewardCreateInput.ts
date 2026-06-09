import { InvalidReward } from "./InvalidReward";
import { RewardType } from "./Reward";

const MAX_NAME_LENGTH = 120;
const REWARD_TYPES: RewardType[] = ["free_item", "discount", "custom"];

export type RewardCreateInput = {
	name: string;
	description: string;
	costPoints: number;
	type: RewardType;
};

export function parseRewardCreate(input: {
	name?: string;
	description?: string;
	costPoints?: number;
	type?: string;
}): RewardCreateInput {
	const name = input.name?.trim() ?? "";

	if (!name) {
		throw new InvalidReward("Reward name is required");
	}

	if (name.length > MAX_NAME_LENGTH) {
		throw new InvalidReward(`Reward name must be at most ${MAX_NAME_LENGTH} characters`);
	}

	const costPoints = input.costPoints;

	if (costPoints === undefined || costPoints === null) {
		throw new InvalidReward("costPoints is required");
	}

	if (!Number.isInteger(costPoints) || costPoints < 1) {
		throw new InvalidReward("costPoints must be an integer greater than or equal to 1");
	}

	const type = (input.type?.trim() || "free_item") as RewardType;

	if (!REWARD_TYPES.includes(type)) {
		throw new InvalidReward("type must be free_item, discount, or custom");
	}

	return {
		name,
		description: input.description?.trim() ?? "",
		costPoints,
		type,
	};
}
