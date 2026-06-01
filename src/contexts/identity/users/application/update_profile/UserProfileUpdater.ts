import { Service } from "diod";

import { User } from "../../domain/User";
import { UserDoesNotExist } from "../../domain/UserDoesNotExist";
import { UserId } from "../../domain/UserId";
import { UserRepository } from "../../domain/UserRepository";

export type UpdateProfileParams = {
	userId: string;
	name: string;
	profilePicture: string;
};

@Service()
export class UserProfileUpdater {
	constructor(private readonly repository: UserRepository) {}

	async update(params: UpdateProfileParams): Promise<User> {
		const user = await this.repository.search(new UserId(params.userId));
		if (!user) {
			throw new UserDoesNotExist(params.userId);
		}

		user.updateProfile(params.name.trim(), params.profilePicture.trim());

		const existing = await this.repository.searchByEmail(user.email.value);
		const passwordHash = existing?.passwordHash ?? "";
		await this.repository.save(user, passwordHash);

		return user;
	}
}
