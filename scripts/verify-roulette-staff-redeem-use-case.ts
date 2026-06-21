/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	BASIC_PLAN_FEATURES,
	PREMIUM_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { RedeemRouletteSpin } from "../src/contexts/loyalty/games/application/redeem/RedeemRouletteSpin";
import { ListPendingRouletteSpinsForStaff } from "../src/contexts/loyalty/games/application/redeem/ListPendingRouletteSpinsForStaff";
import { parseRouletteConfig } from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { RouletteSpin, type RouletteSpinPrimitives } from "../src/contexts/loyalty/games/domain/RouletteSpin";
import { RouletteSpinAlreadyRedeemed } from "../src/contexts/loyalty/games/domain/RouletteSpinAlreadyRedeemed";
import { RouletteSpinNotFound } from "../src/contexts/loyalty/games/domain/RouletteSpinNotFound";
import { RouletteSpinNotPendingRedeem } from "../src/contexts/loyalty/games/domain/RouletteSpinNotPendingRedeem";
import { RouletteSpinRepository } from "../src/contexts/loyalty/games/domain/RouletteSpinRepository";
import { RouletteStaffForbidden } from "../src/contexts/loyalty/games/domain/RouletteStaffForbidden";
import { Customer } from "../src/contexts/loyalty/customers/domain/Customer";
import { CustomerRepository } from "../src/contexts/loyalty/customers/domain/CustomerRepository";
import { ResolveCustomerByQrForStaffScan } from "../src/contexts/loyalty/customers/application/scan/ResolveCustomerByQrForStaffScan";
import { UserRepository } from "../src/contexts/identity/users/domain/UserRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";

const tenantId = "00000000-0000-4000-8000-0000000000r1";
const customerId = "00000000-0000-4000-8000-0000000000r2";
const spinId = "00000000-0000-4000-8000-0000000000r3";
const staffUserId = "00000000-0000-4000-8000-0000000000r4";

const physicalConfig = parseRouletteConfig({
	version: 1,
	segments: [
		{
			id: "00000000-0000-4000-8000-000000000r01",
			label: "Café gratis",
			weight: 100,
			prizeType: "physical",
			prize: { description: "Café gratis" },
			stockLimit: null,
			stockUsed: 0,
		},
		{
			id: "00000000-0000-4000-8000-000000000r02",
			label: "Sin premio",
			weight: 1,
			prizeType: "none",
			prize: {},
			stockLimit: null,
			stockUsed: 0,
		},
	],
	rules: {
		maxSpinsPerDay: 1,
		maxSpinsPerWeek: 3,
		eligibilityTtlHours: 24,
		trigger: "after_staff_scan",
	},
});

class InMemoryRouletteSpinRepository extends RouletteSpinRepository {
	private spins: RouletteSpin[] = [];

	setSpins(spins: RouletteSpin[]): void {
		this.spins = spins;
	}

	async save(spin: RouletteSpin): Promise<void> {
		const id = spin.toPrimitives().id;
		this.spins = this.spins.filter((existing) => existing.toPrimitives().id !== id);
		this.spins.push(spin);
	}

	async searchById(tenantIdValue: string, id: string): Promise<RouletteSpin | null> {
		return (
			this.spins.find(
				(spin) => spin.toPrimitives().id === id && spin.toPrimitives().tenantId === tenantIdValue,
			) ?? null
		);
	}

	async countByCustomerSince(): Promise<number> {
		return 0;
	}

	async listPendingRedeemByCustomer(
		tenantIdValue: string,
		customerIdValue: string,
	): Promise<RouletteSpin[]> {
		return this.spins.filter((spin) => {
			const primitives = spin.toPrimitives();

			return (
				primitives.tenantId === tenantIdValue &&
				primitives.customerId === customerIdValue &&
				primitives.status === "pending_redeem" &&
				primitives.prizeType === "physical"
			);
		});
	}

	get(id: string): RouletteSpin | undefined {
		return this.spins.find((spin) => spin.toPrimitives().id === id);
	}
}

class InMemoryCustomerRepository extends CustomerRepository {
	constructor(private readonly customer: Customer) {
		super();
	}

	async save(customer: Customer): Promise<void> {
		this.customer = customer;
	}

	async searchById(tenantIdValue: string, id: string): Promise<Customer | null> {
		if (tenantIdValue !== tenantId || id !== customerId) {
			return null;
		}

		return this.customer;
	}

	async searchByQrValue(tenantIdValue: string, qrValue: string): Promise<Customer | null> {
		if (tenantIdValue !== tenantId || qrValue !== this.customer.toPrimitives().qrValue) {
			return null;
		}

		return this.customer;
	}

	async searchByUserIdAndTenantId(): Promise<Customer | null> {
		return this.customer;
	}

	async listWithInteractionByUserId(): Promise<never[]> {
		return [];
	}
}

class NoopUserRepository extends UserRepository {
	async save(): Promise<void> {}
	async searchById(): Promise<null> {
		return null;
	}
	async searchByEmail(): Promise<null> {
		return null;
	}
	async searchByQrValue(): Promise<null> {
		return null;
	}
}

class StubAssertTenantPlanFeature {
	constructor(private readonly features: SubscriptionPlanFeatures) {}

	async execute(params: { tenantId: string; feature: "gamification" | "promotions" }): Promise<SubscriptionPlan> {
		if (params.feature === "gamification" && !this.features.gamification) {
			throw new PlanFeatureNotAvailable(params.tenantId, params.feature);
		}

		return SubscriptionPlan.fromPrimitives({
			id: "plan-premium",
			name: "premium",
			priceMonthly: 0,
			priceYearly: 0,
			features: this.features,
			limits: { employees: 50 },
			isActive: true,
		});
	}
}

function createPendingPhysicalSpin(): RouletteSpin {
	return RouletteSpin.fromPrimitives({
		id: spinId,
		tenantId,
		customerId,
		segmentId: "00000000-0000-4000-8000-000000000r01",
		segmentIndex: 0,
		prizeType: "physical",
		prizePayload: { description: "Café gratis" },
		status: "pending_redeem",
		triggerSource: "staff_scan",
		triggerRef: "eligibility-1",
		idempotencyKey: null,
		configSnapshot: physicalConfig.toPrimitives(),
		createdAt: new Date().toISOString(),
		redeemedAt: null,
	});
}

async function main(): Promise<void> {
	const spinRepository = new InMemoryRouletteSpinRepository();
	spinRepository.setSpins([createPendingPhysicalSpin()]);

	const customer = Customer.fromPrimitives({
		id: customerId,
		tenantId,
		userId: "00000000-0000-4000-8000-0000000000r5",
		name: "Redeem Verify",
		email: "redeem@verify.local",
		phone: null,
		qrValue: "qr-redeem-verify",
		pointsBalance: 0,
		visitsCount: 1,
	});
	const customerRepository = new InMemoryCustomerRepository(customer);
	const assertFeature = new StubAssertTenantPlanFeature(PREMIUM_PLAN_FEATURES) as never;
	const resolveCustomer = new ResolveCustomerByQrForStaffScan(
		customerRepository,
		new NoopUserRepository(),
	);

	const redeem = new RedeemRouletteSpin(assertFeature, spinRepository);
	const listPending = new ListPendingRouletteSpinsForStaff(
		assertFeature,
		resolveCustomer,
		spinRepository,
	);

	const result = await redeem.execute({
		tenantId,
		spinId,
		staffRole: TenantRole.Owner,
		staffUserId,
	});

	if (result.status !== "applied" || !result.redeemedAt || result.segmentLabel !== "Café gratis") {
		console.error("❌ redeem should apply physical spin", result);
		process.exit(1);
	}

	const saved = spinRepository.get(spinId)?.toPrimitives();
	if (!saved || saved.status !== "applied" || !saved.redeemedAt) {
		console.error("❌ spin not persisted as applied", saved);
		process.exit(1);
	}

	console.log("✅ RedeemRouletteSpin applies pending physical prize");

	try {
		await redeem.execute({
			tenantId,
			spinId,
			staffRole: TenantRole.Owner,
			staffUserId,
		});
		console.error("❌ second redeem should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteSpinAlreadyRedeemed)) {
			console.error("❌ wrong error on second redeem", error);
			process.exit(1);
		}
	}

	console.log("✅ second redeem is idempotent error");

	try {
		await redeem.execute({
			tenantId,
			spinId: "missing-spin",
			staffRole: TenantRole.Owner,
			staffUserId,
		});
		console.error("❌ missing spin should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteSpinNotFound)) {
			console.error("❌ wrong error on missing spin", error);
			process.exit(1);
		}
	}

	console.log("✅ missing spin blocked");

	try {
		await redeem.execute({
			tenantId,
			spinId,
			staffRole: TenantRole.Customer,
			staffUserId,
		});
		console.error("❌ customer role should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteStaffForbidden)) {
			console.error("❌ wrong error on customer role", error);
			process.exit(1);
		}
	}

	console.log("✅ customer role blocked");

	const pointsSpin = RouletteSpin.fromPrimitives({
		...(createPendingPhysicalSpin().toPrimitives() as RouletteSpinPrimitives),
		id: "00000000-0000-4000-8000-0000000000r6",
		prizeType: "points",
		prizePayload: { points: 10 },
		status: "applied",
	});
	try {
		pointsSpin.redeem();
		console.error("❌ points spin should not redeem");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteSpinNotPendingRedeem)) {
			console.error("❌ wrong error on points spin", error);
			process.exit(1);
		}
	}

	console.log("✅ non-physical spin cannot redeem");

	spinRepository.setSpins([createPendingPhysicalSpin()]);
	const pending = await listPending.execute({
		tenantId,
		qrValue: "qr-redeem-verify",
		staffRole: TenantRole.Employee,
	});

	if (pending.customerId !== customerId || pending.pendingSpins.length !== 1) {
		console.error("❌ list pending by QR", pending);
		process.exit(1);
	}

	console.log("✅ ListPendingRouletteSpinsForStaff by QR");

	const basicRedeem = new RedeemRouletteSpin(
		new StubAssertTenantPlanFeature(BASIC_PLAN_FEATURES) as never,
		spinRepository,
	);

	try {
		await basicRedeem.execute({
			tenantId,
			spinId,
			staffRole: TenantRole.Owner,
			staffUserId,
		});
		console.error("❌ basic plan should throw");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlanFeatureNotAvailable)) {
			console.error("❌ wrong error on basic plan", error);
			process.exit(1);
		}
	}

	console.log("✅ basic plan blocked");
	console.log("✅ verify:roulette-staff-redeem-use-case passed");
}

void main();
