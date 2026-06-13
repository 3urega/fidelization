import { randomUUID } from "crypto";
import { Service } from "diod";

import { User } from "../../domain/User";
import { UserDoesNotExist } from "../../domain/UserDoesNotExist";
import { UserId } from "../../domain/UserId";
import { UserRepository } from "../../domain/UserRepository";

@Service()
export class EnsureUserQrValue {
	constructor(private readonly repository: UserRepository) {}

	async ensure(userId: string): Promise<User> {
		const id = new UserId(userId);

		for (let attempt = 0; attempt < 5; attempt += 1) {
			const user = await this.repository.search(id);
			if (!user) {
				throw new UserDoesNotExist(userId);
			}

			if (user.qrValue) {
				return user;
			}

			const candidate = await this.generateUniqueQrValue();
			await this.repository.assignQrValueIfAbsent(id, candidate);
		}

		const final = await this.repository.search(id);
		if (!final) {
			throw new UserDoesNotExist(userId);
		}

		if (final.qrValue) {
			return final;
		}

		throw new Error("Could not assign qr_value for platform user");
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
