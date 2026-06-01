import { Service } from "diod";

import { UserFinder } from "../../../identity/users/application/find/UserFinder";
import { UserPlan } from "../../../identity/users/domain/UserPlan";
import { UserRepository } from "../../../identity/users/domain/UserRepository";

@Service()
export class DemoPlanSetter {
	constructor(
		private readonly userFinder: UserFinder,
		private readonly userRepository: UserRepository,
	) {}

	async run(userId: string, plan: UserPlan): Promise<{ plan: UserPlan }> {
		if (process.env.ALLOW_DEMO_BILLING !== "1") {
			throw new Error("Demo billing is disabled");
		}

		const user = await this.userFinder.find(userId);
		user.setPlan(plan);
		const credentials = await this.userRepository.searchByEmail(user.email.value);
		await this.userRepository.save(user, credentials?.passwordHash ?? "");

		return { plan: user.plan };
	}
}
