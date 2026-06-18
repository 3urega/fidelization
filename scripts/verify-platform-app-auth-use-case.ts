/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { LoginPlatformUser } from "../src/contexts/identity/users/application/authenticate/LoginPlatformUser";
import { UserAuthenticator } from "../src/contexts/identity/users/application/authenticate/UserAuthenticator";
import { RegisterPlatformUser } from "../src/contexts/identity/users/application/register/RegisterPlatformUser";
import { EmailAlreadyRegistered } from "../src/contexts/identity/users/domain/EmailAlreadyRegistered";
import { InvalidCredentials } from "../src/contexts/identity/users/domain/InvalidCredentials";
import { PlatformUserCannotUseUserLogin } from "../src/contexts/identity/users/domain/PlatformUserCannotUseUserLogin";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository, UserWithPasswordHash } from "../src/contexts/identity/users/domain/UserRepository";
import type { UserSearchZone } from "../src/contexts/identity/users/domain/UserSearchZone";
import { hashPassword } from "../src/lib/auth/password";

class InMemoryUserRepository extends UserRepository {
	private users = new Map<string, UserWithPasswordHash>();

	async save(user: User, passwordHash: string): Promise<void> {
		this.users.set(user.email.value, { user, passwordHash });
	}

	async search(id: UserId): Promise<User | null> {
		for (const row of this.users.values()) {
			if (row.user.id.value === id.value) {
				return row.user;
			}
		}

		return null;
	}

	async searchByEmail(email: string): Promise<UserWithPasswordHash | null> {
		return this.users.get(email.toLowerCase().trim()) ?? null;
	}

	async searchByQrValue(qrValue: string): Promise<User | null> {
		for (const row of this.users.values()) {
			if (row.user.qrValue === qrValue) {
				return row.user;
			}
		}

		return null;
	}

	async searchByOAuthSubject(): Promise<User | null> {
		return null;
	}

	async updatePasswordHash(userId: UserId, passwordHash: string): Promise<void> {
		for (const [email, row] of this.users.entries()) {
			if (row.user.id.value === userId.value) {
				this.users.set(email, { user: row.user, passwordHash });

				return;
			}
		}
	}

	async assignQrValueIfAbsent(_userId: UserId, _qrValue: string): Promise<void> {}

	async updateSearchZone(_userId: UserId, _zone: UserSearchZone | null): Promise<User> {
		throw new Error("updateSearchZone not implemented");
	}

	async isPlatformSuperadmin(userId: string): Promise<boolean> {
		for (const row of this.users.values()) {
			if (row.user.id.value === userId) {
				return row.user.email.value === "superadmin@platform.local";
			}
		}

		return false;
	}
}

async function expectError<T extends Error>(
	label: string,
	action: () => Promise<unknown>,
	Expected: new (...args: never[]) => T,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected ${Expected.name} for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof Expected)) {
			console.error(`❌ wrong error for ${label}:`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → ${Expected.name}`);
}

async function main(): Promise<void> {
	const repository = new InMemoryUserRepository();
	const registerPlatformUser = new RegisterPlatformUser(repository);
	const loginPlatformUser = new LoginPlatformUser(new UserAuthenticator(repository), repository);

	const registered = await registerPlatformUser.register({
		name: "App User",
		email: "app-user@example.local",
		password: "password123",
	});

	if (!registered.qrValue) {
		console.error("❌ RegisterPlatformUser must assign qrValue");
		process.exit(1);
	}

	const stored = await repository.searchByEmail("app-user@example.local");
	if (!stored || stored.user.id.value !== registered.id.value) {
		console.error("❌ RegisterPlatformUser must persist user");
		process.exit(1);
	}

	console.log("✅ RegisterPlatformUser creates user with qrValue");

	await expectError(
		"duplicate email",
		() =>
			registerPlatformUser.register({
				name: "Other",
				email: "app-user@example.local",
				password: "password123",
			}),
		EmailAlreadyRegistered,
	);

	const loggedIn = await loginPlatformUser.login("app-user@example.local", "password123");
	if (loggedIn.id.value !== registered.id.value) {
		console.error("❌ LoginPlatformUser should return registered user");
		process.exit(1);
	}

	console.log("✅ LoginPlatformUser authenticates platform user");

	await expectError(
		"invalid password",
		() => loginPlatformUser.login("app-user@example.local", "wrong-password"),
		InvalidCredentials,
	);

	const superadmin = User.create(
		randomUUID(),
		"Super Admin",
		"superadmin@platform.local",
		"",
		randomUUID(),
	);
	await repository.save(superadmin, await hashPassword("superadmin123"));

	await expectError(
		"superadmin blocked from user login",
		() => loginPlatformUser.login("superadmin@platform.local", "superadmin123"),
		PlatformUserCannotUseUserLogin,
	);

	console.log("✅ verify:platform-app-auth-use-case passed");
}

void main();
