import { Service } from "diod";

import { UserAuthenticator } from "../../../identity/users/application/authenticate/UserAuthenticator";
import { User } from "../../../identity/users/domain/User";
import { UserRepository } from "../../../identity/users/domain/UserRepository";
import { PlatformAccessDenied } from "../../domain/PlatformAccessDenied";

@Service()
export class PlatformAuthenticator {
	constructor(
		private readonly userAuthenticator: UserAuthenticator,
		private readonly userRepository: UserRepository,
	) {}

	async login(email: string, password: string): Promise<User> {
		const user = await this.userAuthenticator.login(email, password);
		const isSuperadmin = await this.userRepository.isPlatformSuperadmin(user.id.value);

		if (!isSuperadmin) {
			throw new PlatformAccessDenied();
		}

		return user;
	}
}
