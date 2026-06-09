/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { EnterPlatformUserFromTenantSession } from "../src/contexts/identity/users/application/authenticate/EnterPlatformUserFromTenantSession";
import { PlatformUserCannotUseUserLogin } from "../src/contexts/identity/users/domain/PlatformUserCannotUseUserLogin";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { UserFinder } from "../src/contexts/identity/users/application/find/UserFinder";

class StubUserRepository extends UserRepository {
	constructor(private readonly superadmin: boolean) {
		super();
	}

	async isPlatformSuperadmin(): Promise<boolean> {
		return this.superadmin;
	}

	async save(): Promise<void> {
		return;
	}

	async search(id: UserId): Promise<User | null> {
		return User.fromPrimitives({
			id: id.value,
			name: "Verify User",
			email: "verify@example.local",
			profilePicture: "",
			plan: "FREE",
			qrValue: `qr-${id.value}`,
			oauthProvider: null,
			oauthSubject: null,
		});
	}

	async searchByEmail(): Promise<null> {
		return null;
	}

	async searchByQrValue(): Promise<null> {
		return null;
	}

	async searchByOAuthSubject(): Promise<null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {
		return;
	}
}

class StubUserFinder extends UserFinder {
	constructor(private readonly user: User) {
		super(new StubUserRepository(false));
	}

	async find(): Promise<User> {
		return this.user;
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
}

async function main(): Promise<void> {
	const userId = randomUUID();
	const user = User.fromPrimitives({
		id: userId,
		name: "Verify Restore User",
		email: "verify-restore@example.local",
		profilePicture: "",
		plan: "FREE",
		qrValue: `qr-${userId}`,
		oauthProvider: null,
		oauthSubject: null,
	});

	const useCase = new EnterPlatformUserFromTenantSession(
		new StubUserFinder(user),
		new StubUserRepository(false),
	);

	const restored = await useCase.enter(userId);
	if (restored.id.value !== userId) {
		console.error("❌ expected same user restored");
		process.exit(1);
	}

	console.log("✅ EnterPlatformUserFromTenantSession restores user");

	const blocked = new EnterPlatformUserFromTenantSession(
		new StubUserFinder(user),
		new StubUserRepository(true),
	);
	await expectError(
		"superadmin blocked",
		() => blocked.enter(userId),
		PlatformUserCannotUseUserLogin,
	);

	console.log("✅ EnterPlatformUserFromTenantSession rejects superadmin");
	console.log("✅ verify:platform-app-enter-user-use-case passed");
}

void main();
