/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { SyncTenantSubscriptionFromStripe } from "../src/contexts/billing/subscriptions/application/sync/SyncTenantSubscriptionFromStripe";
import { StripeSubscriptionNotFound } from "../src/contexts/billing/subscriptions/domain/StripeSubscriptionNotFound";
import { PRO_PLAN_FEATURES } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import {
	SubscriptionStatus,
	TenantSubscription,
} from "../src/contexts/billing/subscriptions/domain/TenantSubscription";
import { UpdateTenantStatus } from "../src/contexts/tenants/tenants/application/update/UpdateTenantStatus";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000l1";
const planProId = "00000000-0000-4000-8000-000000000006";
const subscriptionId = "00000000-0000-4000-8000-0000000000sub1";
const stripeSubscriptionId = "sub_test_lifecycle";

const planPro = SubscriptionPlan.fromPrimitives({
	id: planProId,
	name: "pro",
	priceMonthly: 2900,
	priceYearly: 29000,
	features: PRO_PLAN_FEATURES,
	limits: { employees: 10 },
	isActive: true,
});

function baseTenant(status: TenantStatus = TenantStatus.Active): Tenant {
	return Tenant.fromPrimitives({
		id: tenantId,
		name: "Stripe Lifecycle Verify Cafe",
		slug: "stripe-lifecycle-verify",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "pro",
		subscriptionPlanId: planProId,
		status,
		createdAt: new Date().toISOString(),
	});
}

function activeSubscription(): TenantSubscription {
	return TenantSubscription.fromPrimitives({
		id: subscriptionId,
		tenantId,
		planId: planProId,
		status: "active",
		stripeSubscriptionId,
	});
}

class MutableStubTenantRepository extends TenantRepository {
	constructor(public tenant: Tenant | null) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return this.tenant ? [this.tenant] : [];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === this.tenant?.id ? this.tenant : null;
	}

	async updateStatus(_tenantId: string, status: TenantStatus): Promise<Tenant | null> {
		if (!this.tenant) {
			return null;
		}

		const primitives = this.tenant.toPrimitives();
		this.tenant = Tenant.fromPrimitives({
			...primitives,
			status,
		});

		return this.tenant;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class InMemoryTenantBillingRepository extends TenantBillingRepository {
	constructor(private subscriptions: TenantSubscription[]) {
		super();
	}

	async savePlan(): Promise<void> {}

	async searchPlanByName(): Promise<SubscriptionPlan | null> {
		return planPro;
	}

	async searchPlanById(): Promise<SubscriptionPlan | null> {
		return planPro;
	}

	async listActivePlans(): Promise<SubscriptionPlan[]> {
		return [planPro];
	}

	async saveSubscription(subscription: TenantSubscription): Promise<void> {
		this.subscriptions.push(subscription);
	}

	async searchActiveSubscription(tenantIdParam: string): Promise<TenantSubscription | null> {
		return (
			this.subscriptions.find(
				(subscription) =>
					subscription.tenantId === tenantIdParam && subscription.status === "active",
			) ?? null
		);
	}

	async searchSubscriptionByStripeId(
		stripeSubscriptionIdParam: string,
	): Promise<TenantSubscription | null> {
		return (
			this.subscriptions.find(
				(subscription) => subscription.stripeSubscriptionId === stripeSubscriptionIdParam,
			) ?? null
		);
	}

	async updateSubscriptionStatus(
		subscriptionIdParam: string,
		status: SubscriptionStatus,
	): Promise<void> {
		this.subscriptions = this.subscriptions.map((subscription) =>
			subscription.id === subscriptionIdParam ? subscription.withStatus(status) : subscription,
		);
	}

	async linkTenantPlan(): Promise<void> {}

	getSubscription(): TenantSubscription | undefined {
		return this.subscriptions.find((subscription) => subscription.id === subscriptionId);
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
			console.error(`❌ wrong error for ${label}`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → ${Expected.name}`);
}

async function verifySyncStub(): Promise<void> {
	const tenantRepository = new MutableStubTenantRepository(baseTenant());
	const billingRepository = new InMemoryTenantBillingRepository([activeSubscription()]);
	const sync = new SyncTenantSubscriptionFromStripe(
		billingRepository,
		tenantRepository,
		new UpdateTenantStatus(tenantRepository),
	);

	await expectError("SyncTenantSubscriptionFromStripe missing subscription", () =>
		sync.execute({
			stripeSubscriptionId: "sub_missing",
			stripeStatus: "past_due",
		}),
		StripeSubscriptionNotFound,
	);

	const suspend = await sync.execute({
		stripeSubscriptionId,
		stripeStatus: "past_due",
	});

	if (
		!suspend.changed ||
		suspend.subscriptionStatus !== "past_due" ||
		suspend.tenantStatus !== TenantStatus.Suspended
	) {
		console.error("❌ past_due should suspend tenant", suspend);
		process.exit(1);
	}

	console.log("✅ past_due suspends tenant and marks subscription past_due");

	const recover = await sync.execute({
		stripeSubscriptionId,
		stripeStatus: "active",
	});

	if (
		!recover.changed ||
		recover.subscriptionStatus !== "active" ||
		recover.tenantStatus !== TenantStatus.Active
	) {
		console.error("❌ active after past_due should reactivate tenant", recover);
		process.exit(1);
	}

	console.log("✅ active after past_due reactivates tenant and subscription");

	const manualSuspendRepository = new MutableStubTenantRepository(
		baseTenant(TenantStatus.Suspended),
	);
	const manualSuspendBilling = new InMemoryTenantBillingRepository([activeSubscription()]);
	const manualSuspendSync = new SyncTenantSubscriptionFromStripe(
		manualSuspendBilling,
		manualSuspendRepository,
		new UpdateTenantStatus(manualSuspendRepository),
	);

	const noRecover = await manualSuspendSync.execute({
		stripeSubscriptionId,
		stripeStatus: "active",
	});

	if (
		noRecover.changed ||
		noRecover.tenantStatus !== TenantStatus.Suspended ||
		noRecover.subscriptionStatus !== "active"
	) {
		console.error("❌ active should not reactivate manually suspended tenant", noRecover);
		process.exit(1);
	}

	console.log("✅ active does not reactivate tenant suspended manually while subscription active");

	const canceledBilling = new InMemoryTenantBillingRepository([
		TenantSubscription.fromPrimitives({
			id: subscriptionId,
			tenantId,
			planId: planProId,
			status: "canceled",
			stripeSubscriptionId,
		}),
	]);
	const canceledTenantRepository = new MutableStubTenantRepository(
		baseTenant(TenantStatus.Suspended),
	);
	const canceledSync = new SyncTenantSubscriptionFromStripe(
		canceledBilling,
		canceledTenantRepository,
		new UpdateTenantStatus(canceledTenantRepository),
	);

	const canceledReplay = await canceledSync.execute({
		stripeSubscriptionId,
		stripeStatus: "past_due",
	});

	if (canceledReplay.changed) {
		console.error("❌ canceled subscription should be idempotent", canceledReplay);
		process.exit(1);
	}

	console.log("✅ canceled subscription sync is idempotent");

	const idempotentBilling = new InMemoryTenantBillingRepository([
		TenantSubscription.fromPrimitives({
			id: subscriptionId,
			tenantId,
			planId: planProId,
			status: "past_due",
			stripeSubscriptionId,
		}),
	]);
	const idempotentTenantRepository = new MutableStubTenantRepository(
		baseTenant(TenantStatus.Suspended),
	);
	const idempotentSync = new SyncTenantSubscriptionFromStripe(
		idempotentBilling,
		idempotentTenantRepository,
		new UpdateTenantStatus(idempotentTenantRepository),
	);

	const idempotentSuspend = await idempotentSync.execute({
		stripeSubscriptionId,
		stripeStatus: "past_due",
	});

	if (idempotentSuspend.changed) {
		console.error("❌ repeated past_due should be idempotent", idempotentSuspend);
		process.exit(1);
	}

	console.log("✅ repeated past_due while already suspended is idempotent");
	console.log("✅ verify:stripe-webhooks-use-case passed");
}

void verifySyncStub();
