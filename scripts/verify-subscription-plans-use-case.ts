/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssignTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/assign/AssignTenantSubscriptionPlan";
import { ListSubscriptionPlans } from "../src/contexts/billing/subscriptions/application/list/ListSubscriptionPlans";
import {
	BASIC_PLAN_FEATURES,
	PREMIUM_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { SubscriptionPlanNotFound } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import { TenantBillingForbidden } from "../src/contexts/billing/subscriptions/domain/TenantBillingForbidden";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { TenantSubscription } from "../src/contexts/billing/subscriptions/domain/TenantSubscription";
import { PrismaTenantBillingRepository } from "../src/contexts/billing/subscriptions/infrastructure/PrismaTenantBillingRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { TenantAccessSuspended } from "../src/contexts/tenants/tenants/domain/TenantAccessSuspended";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";
import { prisma } from "../src/lib/prisma";

const tenantId = "00000000-0000-4000-8000-0000000000p1";
const planBasicId = "00000000-0000-4000-8000-000000000004";
const planProId = "00000000-0000-4000-8000-000000000006";
const planPremiumId = "00000000-0000-4000-8000-000000000007";

const planBasic = SubscriptionPlan.fromPrimitives({
	id: planBasicId,
	name: "basic",
	priceMonthly: 0,
	priceYearly: 0,
	features: BASIC_PLAN_FEATURES,
	limits: { employees: 3 },
	isActive: true,
});

const planPro = SubscriptionPlan.fromPrimitives({
	id: planProId,
	name: "pro",
	priceMonthly: 2900,
	priceYearly: 29000,
	features: PRO_PLAN_FEATURES,
	limits: { employees: 10 },
	isActive: true,
});

const planInactive = SubscriptionPlan.fromPrimitives({
	id: planPremiumId,
	name: "premium",
	priceMonthly: 5900,
	priceYearly: 59000,
	features: PREMIUM_PLAN_FEATURES,
	limits: { employees: 50 },
	isActive: false,
});

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

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}

	assignPlan(planName: string): void {
		if (!this.tenant) {
			return;
		}

		const primitives = this.tenant.toPrimitives();
		this.tenant = Tenant.fromPrimitives({
			...primitives,
			subscriptionPlan: planName,
		});
	}
}

class InMemoryTenantBillingRepository extends TenantBillingRepository {
	constructor(
		private readonly plans: SubscriptionPlan[],
		private readonly onLink?: (tenantId: string, plan: SubscriptionPlan) => void,
	) {
		super();
	}

	async savePlan(): Promise<void> {}

	async searchPlanByName(name: string): Promise<SubscriptionPlan | null> {
		return this.plans.find((plan) => plan.name === name) ?? null;
	}

	async searchPlanById(planId: string): Promise<SubscriptionPlan | null> {
		return this.plans.find((plan) => plan.id === planId) ?? null;
	}

	async listActivePlans(): Promise<SubscriptionPlan[]> {
		return this.plans.filter((plan) => plan.isActive);
	}

	async saveSubscription(): Promise<void> {}

	async searchActiveSubscription(): Promise<TenantSubscription | null> {
		return null;
	}

	async linkTenantPlan(tenantId: string, planId: string): Promise<void> {
		const plan = await this.searchPlanById(planId);
		if (!plan) {
			throw new Error(`Subscription plan ${planId} not found`);
		}

		this.onLink?.(tenantId, plan);
	}
}

function baseTenant(status: TenantStatus = TenantStatus.Active): Tenant {
	return Tenant.fromPrimitives({
		id: tenantId,
		name: "Plans Verify Cafe",
		slug: "plans-verify-cafe",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "basic",
		status,
		createdAt: new Date().toISOString(),
	});
}

async function expectForbidden(
	label: string,
	action: () => Promise<unknown>,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected TenantBillingForbidden for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantBillingForbidden)) {
			console.error(`❌ wrong error for ${label}`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → TenantBillingForbidden`);
}

async function verifyListPlansStub(): Promise<void> {
	const tenantRepository = new MutableStubTenantRepository(baseTenant());
	const billingRepository = new InMemoryTenantBillingRepository([planBasic, planPro, planInactive]);
	const list = new ListSubscriptionPlans(tenantRepository, billingRepository);

	const ownerPlans = await list.execute({ tenantId, role: TenantRole.Owner });

	if (ownerPlans.length !== 2 || !ownerPlans.some((plan) => plan.name === "pro")) {
		console.error("❌ ListSubscriptionPlans owner", ownerPlans.map((plan) => plan.name));
		process.exit(1);
	}

	console.log("✅ ListSubscriptionPlans owner returns active plans");

	const employeePlans = await list.execute({ tenantId, role: TenantRole.Employee });

	if (employeePlans.length !== 2) {
		console.error("❌ ListSubscriptionPlans employee", employeePlans.length);
		process.exit(1);
	}

	console.log("✅ ListSubscriptionPlans employee can read catalog");

	await expectForbidden("ListSubscriptionPlans customer", () =>
		list.execute({ tenantId, role: TenantRole.Customer }),
	);

	const suspendedTenantRepository = new MutableStubTenantRepository(
		baseTenant(TenantStatus.Suspended),
	);
	const suspendedList = new ListSubscriptionPlans(suspendedTenantRepository, billingRepository);

	try {
		await suspendedList.execute({ tenantId, role: TenantRole.Owner });
		console.error("❌ expected TenantAccessSuspended on list");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantAccessSuspended)) {
			console.error("❌ wrong error for suspended tenant list", error);
			process.exit(1);
		}
	}

	console.log("✅ suspended tenant → TenantAccessSuspended on list");
}

async function verifyAssignPlanStub(): Promise<void> {
	const tenantRepository = new MutableStubTenantRepository(baseTenant());
	const billingRepository = new InMemoryTenantBillingRepository(
		[planBasic, planPro, planInactive],
		(linkedTenantId, plan) => {
			if (linkedTenantId === tenantId) {
				tenantRepository.assignPlan(plan.name);
			}
		},
	);
	const assign = new AssignTenantSubscriptionPlan(tenantRepository, billingRepository);

	await expectForbidden("AssignTenantSubscriptionPlan employee", () =>
		assign.execute({ tenantId, role: TenantRole.Employee, planId: planProId }),
	);

	try {
		await assign.execute({ tenantId, role: TenantRole.Owner, planId: "missing-plan" });
		console.error("❌ expected SubscriptionPlanNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof SubscriptionPlanNotFound)) {
			console.error("❌ wrong error for missing plan", error);
			process.exit(1);
		}
	}

	console.log("✅ missing plan → SubscriptionPlanNotFound");

	try {
		await assign.execute({ tenantId, role: TenantRole.Owner, planId: planPremiumId });
		console.error("❌ expected SubscriptionPlanNotFound for inactive plan");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof SubscriptionPlanNotFound)) {
			console.error("❌ wrong error for inactive plan", error);
			process.exit(1);
		}
	}

	console.log("✅ inactive plan → SubscriptionPlanNotFound");

	const result = await assign.execute({
		tenantId,
		role: TenantRole.Owner,
		planId: planProId,
	});

	if (result.plan.name !== "pro" || result.tenant.subscriptionPlan !== "pro") {
		console.error("❌ AssignTenantSubscriptionPlan owner", result);
		process.exit(1);
	}

	console.log("✅ AssignTenantSubscriptionPlan owner updates tenant plan");

	const suspendedTenantRepository = new MutableStubTenantRepository(
		baseTenant(TenantStatus.Suspended),
	);
	const suspendedAssign = new AssignTenantSubscriptionPlan(
		suspendedTenantRepository,
		billingRepository,
	);

	try {
		await suspendedAssign.execute({ tenantId, role: TenantRole.Owner, planId: planProId });
		console.error("❌ expected TenantAccessSuspended on assign");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantAccessSuspended)) {
			console.error("❌ wrong error for suspended tenant assign", error);
			process.exit(1);
		}
	}

	console.log("✅ suspended tenant → TenantAccessSuspended on assign");

	const missingTenantAssign = new AssignTenantSubscriptionPlan(
		new MutableStubTenantRepository(null),
		billingRepository,
	);

	try {
		await missingTenantAssign.execute({ tenantId, role: TenantRole.Owner, planId: planProId });
		console.error("❌ expected TenantNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ wrong error for missing tenant", error);
			process.exit(1);
		}
	}

	console.log("✅ missing tenant → TenantNotFound");
}

async function verifyPrismaCatalog(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.log("✅ verify:subscription-plans-use-case passed (stub only, no DATABASE_URL)");

		return;
	}

	const billingRepository = new PrismaTenantBillingRepository();
	const plans = await billingRepository.listActivePlans();
	const names = plans.map((plan) => plan.name).sort();

	if (names.length < 3 || !names.includes("basic") || !names.includes("pro") || !names.includes("premium")) {
		console.error("❌ Prisma listActivePlans", names);
		process.exit(1);
	}

	console.log("✅ Prisma catalog has basic/pro/premium active plans");
	console.log("✅ verify:subscription-plans-use-case passed");
}

async function main(): Promise<void> {
	await verifyListPlansStub();
	await verifyAssignPlanStub();
	await verifyPrismaCatalog();
}

void main();
