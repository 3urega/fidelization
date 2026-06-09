import { Service } from "diod";

import { UserFinder } from "../../../../identity/users/application/find/UserFinder";
import { PlatformUserCannotUseUserLogin } from "../../../../identity/users/domain/PlatformUserCannotUseUserLogin";
import { User } from "../../../../identity/users/domain/User";
import { UserRepository } from "../../../../identity/users/domain/UserRepository";

@Service()
export class EnterPlatformUserFromTenantSession {
	constructor(
		private readonly userFinder: UserFinder,
		private readonly userRepository: UserRepository,
	) {}

	async enter(userId: string): Promise<User> {
		const user = await this.userFinder.find(userId);

		if (await this.userRepository.isPlatformSuperadmin(user.id.value)) {
			throw new PlatformUserCannotUseUserLogin();
		}

		return user;
	}
}
