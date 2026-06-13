/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ListPlatformOwners } from "../src/contexts/platform/application/owners/ListPlatformOwners";
import {
	type PlatformOwnerSummary,
	type PlatformOwnersListParams,
	type PlatformOwnersPage,
} from "../src/contexts/platform/domain/PlatformOwnerSummary";
import { PlatformOwnersReadRepository } from "../src/contexts/platform/domain/PlatformOwnersReadRepository";

const ownerMulti: PlatformOwnerSummary = {
	userId: "user-owner-multi",
	name: "Ana Owner",
	email: "ana.owner@example.local",
	businesses: [
		{
			tenantId: "tenant-a",
			slug: "cafe-a",
			name: "Cafe A",
			subscriptionPlan: "basic",
			status: "active",
		},
		{
			tenantId: "tenant-b",
			slug: "cafe-b",
			name: "Cafe B",
			subscriptionPlan: "pro",
			status: "suspended",
		},
	],
};

const ownerSingle: PlatformOwnerSummary = {
	userId: "user-owner-single",
	name: "Bob Owner",
	email: "bob.owner@example.local",
	businesses: [
		{
			tenantId: "tenant-c",
			slug: "cafe-demo",
			name: "Cafe Demo",
			subscriptionPlan: "basic",
			status: "active",
		},
	],
};

class InMemoryPlatformOwnersReadRepository extends PlatformOwnersReadRepository {
	constructor(private readonly allOwners: PlatformOwnerSummary[]) {
		super();
	}

	async list(params: PlatformOwnersListParams): Promise<PlatformOwnersPage> {
		const search = params.search?.trim().toLowerCase();

		let filtered = this.allOwners.filter((owner) => owner.businesses.length > 0);

		if (search) {
			filtered = filtered.filter(
				(owner) =>
					owner.name.toLowerCase().includes(search) ||
					owner.email.toLowerCase().includes(search),
			);
		}

		filtered = [...filtered].sort((left, right) => left.name.localeCompare(right.name));

		const total = filtered.length;
		const slice = filtered.slice(params.offset, params.offset + params.limit + 1);
		const hasMore = slice.length > params.limit;
		const owners = hasMore ? slice.slice(0, params.limit) : slice;

		return {
			owners,
			total,
			hasMore,
			offset: params.offset,
			limit: params.limit,
		};
	}
}

async function main(): Promise<void> {
	const repository = new InMemoryPlatformOwnersReadRepository([ownerMulti, ownerSingle]);
	const useCase = new ListPlatformOwners(repository);

	const page1 = await useCase.execute({ limit: 1, offset: 0 });

	if (page1.owners.length !== 1 || page1.total !== 2 || !page1.hasMore) {
		console.error("❌ pagination page 1", page1);
		process.exit(1);
	}

	if (page1.owners[0]?.userId !== ownerMulti.userId) {
		console.error("❌ expected first owner Ana by name asc", page1.owners[0]);
		process.exit(1);
	}

	const page2 = await useCase.execute({ limit: 1, offset: 1 });

	if (page2.owners.length !== 1 || page2.hasMore || page2.owners[0]?.userId !== ownerSingle.userId) {
		console.error("❌ pagination page 2", page2);
		process.exit(1);
	}

	const byEmail = await useCase.execute({ search: "bob.owner" });

	if (byEmail.total !== 1 || byEmail.owners[0]?.email !== ownerSingle.email) {
		console.error("❌ search by email", byEmail);
		process.exit(1);
	}

	const byName = await useCase.execute({ search: "Ana" });

	if (byName.total !== 1 || byName.owners[0]?.name !== ownerMulti.name) {
		console.error("❌ search by name", byName);
		process.exit(1);
	}

	const clamped = await useCase.execute({ limit: 999 });

	if (clamped.limit !== 50) {
		console.error("❌ limit should clamp to 50, got", clamped.limit);
		process.exit(1);
	}

	console.log("✅ ListPlatformOwners pagination + search");
	console.log("✅ verify:platform-admin-owners-use-case passed");
}

void main();
