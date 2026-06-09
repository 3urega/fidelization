import { Service } from "diod";

import { PlatformUserCannotUseUserLogin } from "../../domain/PlatformUserCannotUseUserLogin";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";
import { UserAuthenticator } from "./UserAuthenticator";

@Service()
export class LoginPlatformUser {
	constructor(
		private readonly userAuthenticator: UserAuthenticator,
		private readonly userRepository: UserRepository,
	) {}

	async login(email: string, password: string): Promise<User> {
		const user = await this.userAuthenticator.login(email, password);

		if (await this.userRepository.isPlatformSuperadmin(user.id.value)) {
			throw new PlatformUserCannotUseUserLogin();
		}

		return user;
	}
}
