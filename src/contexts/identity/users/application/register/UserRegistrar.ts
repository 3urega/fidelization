import { randomUUID } from "crypto";
import { Service } from "diod";

import { hashPassword } from "../../../../../lib/auth/password";
import { EmailAlreadyRegistered } from "../../domain/EmailAlreadyRegistered";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";

export type RegisterUserParams = {
	name: string;
	email: string;
	password: string;
	profilePicture?: string;
};

@Service()
export class UserRegistrar {
	constructor(private readonly repository: UserRepository) {}

	async register(params: RegisterUserParams): Promise<User> {
		const existing = await this.repository.searchByEmail(params.email.toLowerCase().trim());
		if (existing) {
			throw new EmailAlreadyRegistered(params.email);
		}

		const user = User.create(
			randomUUID(),
			params.name.trim(),
			params.email.toLowerCase().trim(),
			params.profilePicture?.trim() ?? "",
		);

		const passwordHash = await hashPassword(params.password);
		await this.repository.save(user, passwordHash);

		return user;
	}
}
