/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetCustomerActiveRewards } from "../src/contexts/loyalty/customers/application/profile/GetCustomerActiveRewards";
import { RedeemCustomerReward } from "../src/contexts/loyalty/customers/application/redeem/RedeemCustomerReward";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { InsufficientCustomerPoints } from "../src/contexts/loyalty/customers/domain/InsufficientCustomerPoints";
import { LoyaltyTransaction } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransaction";
import { LoyaltyTransactionRepository } from "../src/contexts/loyalty/loyalty_transactions/domain/LoyaltyTransactionRepository";
import { Reward } from "../src/contexts/loyalty/rewards/domain/Reward";
import { RewardInactive } from "../src/contexts/loyalty/rewards/domain/RewardInactive";
import { RewardNotFound } from "../src/contexts/loyalty/rewards/domain/RewardNotFound";
import { RewardRepository } from "../src/contexts/loyalty/rewards/domain/RewardRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000r2";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Reward Redeem Verify Cafe",
	slug: "reward-redeem-verify-cafe",
	logoUrl: "",
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
	subscriptionPlan: "FREE",
	subscriptionPlanId: null,
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

class InMemoryCustomerRepository extends CustomerRepository {
	private customers = new Map<string, Customer>();

	constructor(initial: Customer[]) {
		super();
		for (const customer of initial) {
			this.customers.set(customer.id, customer);
		}
	}

	async save(customer: Customer): Promise<void> {
		this.customers.set(customer.id, customer);
	}

	async searchById(tenantId: string, id: string): Promise<Customer | null> {
		const customer = this.customers.get(id);

		return customer && customer.tenantId === tenantId ? customer : null;
	}

	async searchByQrValue(): Promise<null> {
		return null;
	}

	async searchByUserIdAndTenantId(): Promise<null> {
		return null;
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}
}

class InMemoryRewardRepository extends RewardRepository {
	private rewards = new Map<string, Reward>();

	constructor(rewards: Reward[]) {
		super();
		for (const reward of rewards) {
			this.rewards.set(reward.id, reward);
		}
	}

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

	async listActiveByTenant(tenantId: string): Promise<Reward[]> {
		return Array.from(this.rewards.values()).filter(
			(reward) => reward.tenantId === tenantId && reward.isActive,
		);
	}
}

class InMemoryLoyaltyTransactionRepository extends LoyaltyTransactionRepository {
	readonly saved: LoyaltyTransaction[] = [];

	async save(transaction: LoyaltyTransaction): Promise<void> {
		this.saved.push(transaction);
	}

	async searchById(): Promise<null> {
		return null;
	}
}

async function main(): Promise<void> {
	const customer = Customer.register({ tenantId, name: "Reward Redeem Customer" });
	const customerWithPoints = Customer.fromPrimitives({
		...customer.toPrimitives(),
		pointsBalance: 5,
	});
	const activeReward = Reward.create({
		tenantId,
		name: "Café gratis",
		description: "",
		costPoints: 3,
		type: "free_item",
	});
	const inactiveReward = Reward.create({
		tenantId,
		name: "Inactive reward",
		description: "",
		costPoints: 1,
		type: "free_item",
	});
	const deactivated = inactiveReward.deactivate();

	const tenantRepository = new StubTenantRepository(baseTenant);
	const customerRepository = new InMemoryCustomerRepository([customerWithPoints]);
	const rewardRepository = new InMemoryRewardRepository([activeReward, deactivated]);
	const loyaltyRepository = new InMemoryLoyaltyTransactionRepository();

	const listActive = new GetCustomerActiveRewards(tenantRepository, rewardRepository);
	const redeem = new RedeemCustomerReward(
		tenantRepository,
		customerRepository,
		rewardRepository,
		loyaltyRepository,
	);

	const activeRewards = await listActive.execute({ tenantId });

	if (activeRewards.length !== 1 || activeRewards[0]?.id !== activeReward.id) {
		console.error("❌ GetCustomerActiveRewards", activeRewards);
		process.exit(1);
	}

	console.log("✅ GetCustomerActiveRewards returns only active rewards");

	const result = await redeem.execute({
		tenantId,
		customerId: customerWithPoints.id,
		rewardId: activeReward.id,
	});

	if (result.customer.pointsBalance !== 2 || result.rewardId !== activeReward.id) {
		console.error("❌ RedeemCustomerReward success", result.customer.toPrimitives());
		process.exit(1);
	}

	const redeemTx = loyaltyRepository.saved.find((tx) => tx.type === "reward_redeemed");

	if (!redeemTx || redeemTx.points !== 3) {
		console.error("❌ reward_redeemed transaction", redeemTx?.toPrimitives());
		process.exit(1);
	}

	console.log("✅ RedeemCustomerReward deducts points and records reward_redeemed");

	try {
		await redeem.execute({
			tenantId,
			customerId: customerWithPoints.id,
			rewardId: activeReward.id,
		});
		console.error("❌ expected InsufficientCustomerPoints after partial redeem");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InsufficientCustomerPoints)) {
			console.error("❌ wrong error for insufficient points", error);
			process.exit(1);
		}
	}

	console.log("✅ insufficient points → InsufficientCustomerPoints");

	try {
		await redeem.execute({
			tenantId,
			customerId: customerWithPoints.id,
			rewardId: deactivated.id,
		});
		console.error("❌ expected RewardInactive");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RewardInactive)) {
			console.error("❌ wrong error for inactive reward", error);
			process.exit(1);
		}
	}

	console.log("✅ inactive reward → RewardInactive");

	try {
		await redeem.execute({
			tenantId,
			customerId: customerWithPoints.id,
			rewardId: "missing-reward-id",
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
	console.log("✅ verify:customer-reward-redeem-use-case passed");
}

void main();
