/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CreateReward } from "../src/contexts/loyalty/rewards/application/create/CreateReward";
import { ListRewards } from "../src/contexts/loyalty/rewards/application/list/ListRewards";
import { UpdateReward } from "../src/contexts/loyalty/rewards/application/update/UpdateReward";
import { InvalidReward } from "../src/contexts/loyalty/rewards/domain/InvalidReward";
import { Reward } from "../src/contexts/loyalty/rewards/domain/Reward";
import { RewardForbidden } from "../src/contexts/loyalty/rewards/domain/RewardForbidden";
import { RewardNotFound } from "../src/contexts/loyalty/rewards/domain/RewardNotFound";
import { RewardRepository } from "../src/contexts/loyalty/rewards/domain/RewardRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000r1";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Reward Verify Cafe",
	slug: "reward-verify-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	status: TenantStatus.Active,
	createdAt: new Date().toISOString(),
});

class StubTenantRepository extends TenantRepository {
	constructor(private readonly tenant: Tenant | null) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return this.tenant ? [this.tenant] : [];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === this.tenant?.id ? this.tenant : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class InMemoryRewardRepository extends RewardRepository {
	private rewards = new Map<string, Reward>();

	async save(reward: Reward): Promise<void> {
		this.rewards.set(reward.id, reward);
	}

	async searchById(tenantId: string, id: string): Promise<Reward | null> {
		const reward = this.rewards.get(id);

		return reward && reward.tenantId === tenantId ? reward : null;
	}

	async listByTenant(tenantId: string): Promise<Reward[]> {
		return Array.from(this.rewards.values()).filter((reward) => reward.tenantId === tenantId);
	}
}

async function expectForbidden(
	label: string,
	action: () => Promise<unknown>,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected RewardForbidden for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RewardForbidden)) {
			console.error(`❌ wrong error for ${label}`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → RewardForbidden`);
}

async function main(): Promise<void> {
	const tenantRepository = new StubTenantRepository(baseTenant);
	const rewardRepository = new InMemoryRewardRepository();
	const create = new CreateReward(tenantRepository, rewardRepository);
	const list = new ListRewards(tenantRepository, rewardRepository);
	const update = new UpdateReward(tenantRepository, rewardRepository);

	await expectForbidden("CreateReward employee", () =>
		create.execute({
			tenantId,
			role: TenantRole.Employee,
			input: { name: "Test", costPoints: 5 },
		}),
	);

	await expectForbidden("ListRewards employee", () =>
		list.execute({ tenantId, role: TenantRole.Employee }),
	);

	const created = await create.execute({
		tenantId,
		role: TenantRole.Owner,
		input: {
			name: "Café gratis",
			description: "Un espresso",
			costPoints: 50,
			type: "free_item",
		},
	});

	if (!created.isActive || created.costPoints !== 50 || created.type !== "free_item") {
		console.error("❌ CreateReward owner", created.toPrimitives());
		process.exit(1);
	}

	console.log("✅ CreateReward owner");

	const rewards = await list.execute({ tenantId, role: TenantRole.Owner });

	if (rewards.length !== 1 || rewards[0]?.id !== created.id) {
		console.error("❌ ListRewards owner", rewards);
		process.exit(1);
	}

	console.log("✅ ListRewards owner");

	await expectForbidden("UpdateReward employee", () =>
		update.execute({
			tenantId,
			role: TenantRole.Employee,
			rewardId: created.id,
			input: { isActive: false },
		}),
	);

	try {
		await update.execute({
			tenantId,
			role: TenantRole.Owner,
			rewardId: "missing-id",
			input: { isActive: false },
		});
		console.error("❌ expected RewardNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RewardNotFound)) {
			console.error("❌ wrong error for missing reward", error);
			process.exit(1);
		}
	}

	console.log("✅ missing reward → RewardNotFound");

	try {
		await update.execute({
			tenantId,
			role: TenantRole.Owner,
			rewardId: created.id,
			input: { isActive: true },
		});
		console.error("❌ expected InvalidReward for reactivation");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidReward)) {
			console.error("❌ wrong error for invalid patch", error);
			process.exit(1);
		}
	}

	console.log("✅ invalid patch → InvalidReward");

	const deactivated = await update.execute({
		tenantId,
		role: TenantRole.Owner,
		rewardId: created.id,
		input: { isActive: false },
	});

	if (deactivated.isActive) {
		console.error("❌ UpdateReward deactivate", deactivated.toPrimitives());
		process.exit(1);
	}

	console.log("✅ UpdateReward deactivate");

	const listedAfterDeactivate = await list.execute({ tenantId, role: TenantRole.Owner });

	if (
		listedAfterDeactivate.length !== 1 ||
		listedAfterDeactivate[0]?.id !== created.id ||
		listedAfterDeactivate[0]?.isActive
	) {
		console.error("❌ ListRewards includes inactive reward", listedAfterDeactivate);
		process.exit(1);
	}

	console.log("✅ ListRewards includes inactive reward");

	const missingTenantCreate = new CreateReward(new StubTenantRepository(null), rewardRepository);

	try {
		await missingTenantCreate.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { name: "X", costPoints: 1 },
		});
		console.error("❌ expected TenantNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ wrong error for missing tenant", error);
			process.exit(1);
		}
	}

	console.log("✅ missing tenant → TenantNotFound");
	console.log("✅ verify:rewards-use-case passed");
}

void main();
