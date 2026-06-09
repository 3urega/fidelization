import { InvalidReward } from "./InvalidReward";

export function parseRewardDeactivate(input: { isActive?: boolean }): { isActive: false } {
	if (input.isActive !== false) {
		throw new InvalidReward("Only deactivation is supported (isActive: false)");
	}

	return { isActive: false };
}
