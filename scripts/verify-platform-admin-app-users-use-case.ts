/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetPlatformAppUserDetail } from "../src/contexts/platform/application/users/GetPlatformAppUserDetail";
import { ListPlatformAppUsers } from "../src/contexts/platform/application/users/ListPlatformAppUsers";
import { EnsureUserQrValue } from "../src/contexts/identity/users/application/profile/EnsureUserQrValue";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserDoesNotExist } from "../src/contexts/identity/users/domain/UserDoesNotExist";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository, UserWithPasswordHash } from "../src/contexts/identity/users/domain/UserRepository";
import type { UserSearchZone } from "../src/contexts/identity/users/domain/UserSearchZone";
import {
	type PlatformAppUserDetail,
	type PlatformAppUserRow,
	type PlatformAppUsersListParams,
	type PlatformAppUsersPage,
} from "../src/contexts/platform/domain/PlatformAppUserSummary";
import { PlatformAppUsersReadRepository } from "../src/contexts/platform/domain/PlatformAppUsersReadRepository";

const now = new Date("2026-06-13T12:00:00.000Z");
const eightDaysAgo = new Date("2026-06-05T12:00:00.000Z");
const threeDaysAgo = new Date("2026-06-10T12:00:00.000Z");
const yesterday = new Date("2026-06-12T10:00:00.000Z");

const activeUser: PlatformAppUserRow = {
	userId: "user-active",
	name: "Ana Cliente",
	email: "ana.cliente@example.local",
	qrValue: "qr-ana",
	createdAt: eightDaysAgo,
	establishmentsCount: 2,
	lastTransactionAt: yesterday,
};

const newUser: PlatformAppUserRow = {
	userId: "user-new",
	name: "Bob Nuevo",
	email: "bob.nuevo@example.local",
	qrValue: null,
	createdAt: threeDaysAgo,
	establishmentsCount: 0,
	lastTransactionAt: null,
};

const idleUser: PlatformAppUserRow = {
	userId: "user-idle",
	name: "Carla Sin Actividad",
	email: "carla.idle@example.local",
	qrValue: "qr-carla",
	createdAt: eightDaysAgo,
	establishmentsCount: 1,
	lastTransactionAt: null,
};

const detailActive: PlatformAppUserDetail = {
	userId: activeUser.userId,
	name: activeUser.name,
	email: activeUser.email,
	qrValue: activeUser.qrValue,
	createdAt: activeUser.createdAt,
	establishments: [
		{
			customerId: "cust-1",
			tenantId: "tenant-a",
			tenantSlug: "cafe-a",
			tenantName: "Cafe A",
			pointsBalance: 40,
			visitsCount: 3,
		},
	],
	recentTransactions: [
		{
			transactionId: "tx-1",
			type: "points_earned",
			tenantId: "tenant-a",
			tenantSlug: "cafe-a",
			tenantName: "Cafe A",
			createdAt: yesterday,
			points: 10,
		},
	],
	generatedAt: now,
};

class InMemoryPlatformAppUsersReadRepository extends PlatformAppUsersReadRepository {
	constructor(private readonly users: PlatformAppUserRow[]) {
		super();
	}

	async list(params: PlatformAppUsersListParams): Promise<PlatformAppUsersPage> {
		const search = params.search?.trim().toLowerCase();
		let filtered = [...this.users];

		if (search) {
			filtered = filtered.filter(
				(user) =>
					user.name.toLowerCase().includes(search) ||
					user.email.toLowerCase().includes(search),
			);
		}

		if (params.filter === "new_7d") {
			const since = new Date(params.referenceDate);
			since.setUTCDate(since.getUTCDate() - 7);
			filtered = filtered.filter((user) => user.createdAt >= since);
		} else if (params.filter === "with_establishments") {
			filtered = filtered.filter((user) => user.establishmentsCount > 0);
		} else if (params.filter === "no_activity") {
			filtered = filtered.filter((user) => user.lastTransactionAt === null);
		}

		filtered.sort((left, right) => left.name.localeCompare(right.name));

		const total = filtered.length;
		const slice = filtered.slice(params.offset, params.offset + params.limit + 1);
		const hasMore = slice.length > params.limit;
		const users = hasMore ? slice.slice(0, params.limit) : slice;

		return {
			users,
			total,
			hasMore,
			offset: params.offset,
			limit: params.limit,
			filter: params.filter,
		};
	}

	async getDetail(userId: string): Promise<PlatformAppUserDetail | null> {
		if (userId !== detailActive.userId) {
			return null;
		}

		return { ...detailActive, generatedAt: new Date() };
	}
}

class InMemoryUserRepository extends UserRepository {
	constructor(private readonly users: Map<string, UserWithPasswordHash>) {
		super();
	}

	async save(): Promise<void> {}

	async search(id: UserId): Promise<User | null> {
		for (const row of this.users.values()) {
			if (row.user.id.value === id.value) {
				return row.user;
			}
		}

		return null;
	}

	async searchByEmail(): Promise<UserWithPasswordHash | null> {
		return null;
	}

	async searchByQrValue(): Promise<User | null> {
		return null;
	}

	async searchByOAuthSubject(): Promise<User | null> {
		return null;
	}

	async updatePasswordHash(): Promise<void> {}

	async assignQrValueIfAbsent(userId: UserId, qrValue: string): Promise<void> {
		for (const [email, row] of this.users.entries()) {
			if (row.user.id.value !== userId.value || row.user.qrValue) {
				continue;
			}

			const updated = User.fromPrimitives({
				...row.user.toPrimitives(),
				qrValue,
			});
			this.users.set(email, { user: updated, passwordHash: row.passwordHash });
		}
	}

	async updateSearchZone(_userId: UserId, _zone: UserSearchZone | null): Promise<User> {
		throw new Error("updateSearchZone not implemented");
	}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

async function main(): Promise<void> {
	const repository = new InMemoryPlatformAppUsersReadRepository([activeUser, newUser, idleUser]);
	const listUseCase = new ListPlatformAppUsers(repository);

	const all = await listUseCase.execute({ referenceDate: now });

	if (all.total !== 3 || all.users.length !== 3 || all.filter !== "all") {
		console.error("❌ list all", all);
		process.exit(1);
	}

	if (all.users[0]?.userId !== activeUser.userId) {
		console.error("❌ expected Ana first by name asc", all.users[0]);
		process.exit(1);
	}

	const withEstablishments = await listUseCase.execute({
		filter: "with_establishments",
		referenceDate: now,
	});

	if (withEstablishments.total !== 2) {
		console.error("❌ with_establishments filter", withEstablishments);
		process.exit(1);
	}

	const noActivity = await listUseCase.execute({ filter: "no_activity", referenceDate: now });

	if (noActivity.total !== 2) {
		console.error("❌ no_activity filter", noActivity);
		process.exit(1);
	}

	const new7d = await listUseCase.execute({ filter: "new_7d", referenceDate: now });

	if (new7d.total !== 1 || new7d.users[0]?.userId !== newUser.userId) {
		console.error("❌ new_7d filter", new7d);
		process.exit(1);
	}

	const search = await listUseCase.execute({ search: "carla", referenceDate: now });

	if (search.total !== 1 || search.users[0]?.email !== idleUser.email) {
		console.error("❌ search by name", search);
		process.exit(1);
	}

	const page1 = await listUseCase.execute({ limit: 2, offset: 0, referenceDate: now });

	if (page1.users.length !== 2 || !page1.hasMore) {
		console.error("❌ pagination page 1", page1);
		process.exit(1);
	}

	const page2 = await listUseCase.execute({ limit: 2, offset: 2, referenceDate: now });

	if (page2.users.length !== 1 || page2.hasMore) {
		console.error("❌ pagination page 2", page2);
		process.exit(1);
	}

	const userRepo = new InMemoryUserRepository(
		new Map([
			[
				activeUser.email,
				{
					user: User.create(
						activeUser.userId,
						activeUser.name,
						activeUser.email,
						"",
						activeUser.qrValue,
					),
					passwordHash: "hash",
				},
			],
			[
				newUser.email,
				{
					user: User.create(newUser.userId, newUser.name, newUser.email, "", null),
					passwordHash: "hash",
				},
			],
		]),
	);

	const detailRepository = new InMemoryPlatformAppUsersReadRepository([activeUser, newUser, idleUser]);
	const detailUseCase = new GetPlatformAppUserDetail(
		detailRepository,
		new EnsureUserQrValue(userRepo),
	);

	const detail = await detailUseCase.execute(activeUser.userId);

	if (
		detail.userId !== activeUser.userId ||
		detail.qrValue !== activeUser.qrValue ||
		detail.establishments.length !== 1 ||
		detail.recentTransactions.length !== 1
	) {
		console.error("❌ detail with transactions", detail);
		process.exit(1);
	}

	try {
		await detailUseCase.execute("missing-user");
		console.error("❌ expected UserDoesNotExist");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof UserDoesNotExist)) {
			console.error("❌ unexpected error for missing user", error);
			process.exit(1);
		}
	}

	console.log("✅ ListPlatformAppUsers filters, pagination, search");
	console.log("✅ GetPlatformAppUserDetail detail + EnsureUserQrValue path");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
