import { randomUUID } from "crypto";
import { Service } from "diod";

import { hashPassword } from "../../../../../lib/auth/password";
import { EmailAlreadyRegistered } from "../../domain/EmailAlreadyRegistered";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";

export type RegisterPlatformUserParams = {
	name: string;
	email: string;
	password: string;
	profilePicture?: string;
};

@Service()
export class RegisterPlatformUser {
	constructor(private readonly repository: UserRepository) {}

	async register(params: RegisterPlatformUserParams): Promise<User> {
		const email = params.email.toLowerCase().trim();
		const existing = await this.repository.searchByEmail(email);
		if (existing) {
			throw new EmailAlreadyRegistered(params.email);
		}

		const qrValue = await this.generateUniqueQrValue();
		const user = User.create(
			randomUUID(),
			params.name.trim(),
			email,
			params.profilePicture?.trim() ?? "",
			qrValue,
		);

		const passwordHash = await hashPassword(params.password);
		await this.repository.save(user, passwordHash);

		return user;
	}

	private async generateUniqueQrValue(): Promise<string> {
		for (let attempt = 0; attempt < 5; attempt += 1) {
			const candidate = randomUUID();
			const existing = await this.repository.searchByQrValue(candidate);
			if (!existing) {
				return candidate;
			}
		}

		throw new Error("Could not generate a unique qr_value for platform user");
	}
}
