import { Service } from "diod";

import { verifyPassword } from "../../../../../lib/auth/password";
import { InvalidCredentials } from "../../domain/InvalidCredentials";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";

export const DEMO_USER_EMAIL = "demo@starter.local";

@Service()
export class UserAuthenticator {
	constructor(private readonly repository: UserRepository) {}

	async login(email: string, password: string): Promise<User> {
		const normalized = email.toLowerCase().trim();
		const found = await this.repository.searchByEmail(normalized);
		if (!found) {
			throw new InvalidCredentials();
		}

		const valid = await verifyPassword(password, found.passwordHash);
		if (!valid) {
			throw new InvalidCredentials();
		}

		return found.user;
	}

	async loginDemo(): Promise<User> {
		const found = await this.repository.searchByEmail(DEMO_USER_EMAIL);
		if (!found) {
			throw new InvalidCredentials();
		}

		return found.user;
	}
}
