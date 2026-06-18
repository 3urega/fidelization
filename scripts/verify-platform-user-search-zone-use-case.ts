/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { ClearUserSearchZone } from "../src/contexts/identity/users/application/profile/ClearUserSearchZone";
import { UpdateUserSearchZone } from "../src/contexts/identity/users/application/profile/UpdateUserSearchZone";
import { InvalidCoordinates } from "../src/contexts/shared/geocoding/domain/InvalidCoordinates";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { InvalidUserSearchZone } from "../src/contexts/identity/users/domain/InvalidUserSearchZone";
import { UserRepository, UserWithPasswordHash } from "../src/contexts/identity/users/domain/UserRepository";
import type { UserSearchZone } from "../src/contexts/identity/users/domain/UserSearchZone";

const userId = "00000000-0000-4000-8000-000000000093";

class InMemoryUserRepository extends UserRepository {
	private users = new Map<string, UserWithPasswordHash>();

	constructor(initialUser: User) {
		super();
		this.users.set(initialUser.email.value, { user: initialUser, passwordHash: "hash" });
	}

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

	async searchByQrValue(): Promise<User | null> {
		return null;
	}

	async searchByOAuthSubject(): Promise<User | null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {}

	async assignQrValueIfAbsent(): Promise<void> {}

	async updateSearchZone(id: UserId, zone: UserSearchZone | null): Promise<User> {
		for (const [email, row] of this.users.entries()) {
			if (row.user.id.value !== id.value) {
				continue;
			}

			const updated = User.fromPrimitives({
				...row.user.toPrimitives(),
				searchZone: zone,
			});
			this.users.set(email, { user: updated, passwordHash: row.passwordHash });

			return updated;
		}

		throw new Error("User not found");
	}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

async function main(): Promise<void> {
	const baseUser = User.create(userId, "Search Zone User", "search-zone@example.local", "", "qr-search-zone");
	const repository = new InMemoryUserRepository(baseUser);
	const update = new UpdateUserSearchZone(repository);
	const clear = new ClearUserSearchZone(repository);

	const saved = await update.execute({
		userId,
		label: " Terrassa, Barcelona ",
		latitude: 41.5639,
		longitude: 2.0084,
	});

	if (!saved.searchZone || saved.searchZone.label !== "Terrassa, Barcelona") {
		console.error("❌ update should persist trimmed label", saved.searchZone);
		process.exit(1);
	}

	if (saved.searchZone.coordinates.latitude !== 41.5639) {
		console.error("❌ update should persist latitude", saved.searchZone);
		process.exit(1);
	}

	console.log("✅ UpdateUserSearchZone saves valid zone");

	const reloaded = await repository.search(new UserId(userId));
	if (!reloaded?.searchZone || reloaded.searchZone.label !== "Terrassa, Barcelona") {
		console.error("❌ repository reload should include search zone", reloaded);
		process.exit(1);
	}

	console.log("✅ search reload includes search zone");

	try {
		await update.execute({
			userId,
			label: "   ",
			latitude: 41.5,
			longitude: 2.1,
		});
		console.error("❌ empty label should throw InvalidUserSearchZone");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidUserSearchZone)) {
			console.error("❌ expected InvalidUserSearchZone for empty label", error);
			process.exit(1);
		}
	}

	console.log("✅ empty label → InvalidUserSearchZone");

	try {
		await update.execute({
			userId,
			label: "Invalid coords",
			latitude: 999,
			longitude: 2.1,
		});
		console.error("❌ invalid latitude should throw InvalidCoordinates");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidCoordinates)) {
			console.error("❌ expected InvalidCoordinates for invalid latitude", error);
			process.exit(1);
		}
	}

	console.log("✅ invalid coordinates → InvalidCoordinates");

	const cleared = await clear.execute({ userId });
	if (cleared.searchZone !== null) {
		console.error("❌ clear should null search zone", cleared);
		process.exit(1);
	}

	const afterClear = await repository.search(new UserId(userId));
	if (afterClear?.searchZone !== null) {
		console.error("❌ repository should persist cleared zone", afterClear);
		process.exit(1);
	}

	console.log("✅ ClearUserSearchZone clears zone");

	const resaved = await update.execute({
		userId,
		label: "Barcelona",
		latitude: 41.3874,
		longitude: 2.1686,
	});

	if (!resaved.searchZone || resaved.searchZone.label !== "Barcelona") {
		console.error("❌ re-save after clear failed", resaved);
		process.exit(1);
	}

	console.log("✅ idempotent re-save after clear");

	console.log("✅ verify:platform-user-search-zone-use-case passed");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
