/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { AssertTenantPlanFeature } from "../src/contexts/billing/subscriptions/application/guard/AssertTenantPlanFeature";
import { ResolveTenantSubscriptionPlan } from "../src/contexts/billing/subscriptions/application/resolve/ResolveTenantSubscriptionPlan";
import {
	BASIC_PLAN_FEATURES,
	PRO_PLAN_FEATURES,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { SubscriptionPlanNotFound } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanNotFound";
import { TenantBillingRepository } from "../src/contexts/billing/subscriptions/domain/TenantBillingRepository";
import { AssignPlatformTenantSubscriptionPlan } from "../src/contexts/platform/application/tenants/AssignPlatformTenantSubscriptionPlan";
import { GetPlatformTenantDetail } from "../src/contexts/platform/application/tenants/GetPlatformTenantDetail";
import { UpdatePlatformTenant } from "../src/contexts/platform/application/tenants/UpdatePlatformTenant";
import type { PlatformTenantDetail } from "../src/contexts/platform/domain/PlatformTenantDetail";
import { PlatformTenantDetailReadRepository } from "../src/contexts/platform/domain/PlatformTenantDetailReadRepository";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import type { TenantPrimitives } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantSlugAlreadyExists } from "../src/contexts/tenants/tenants/domain/TenantSlugAlreadyExists";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000t1";
const otherTenantId = "00000000-0000-4000-8000-0000000000t2";
const planBasicId = "00000000-0000-4000-8000-000000000004";
const planProId = "00000000-0000-4000-8000-000000000006";

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

function makeTenant(overrides: Partial<TenantPrimitives> & { id: string; slug: string }): Tenant {
	return Tenant.fromPrimitives({
		id: overrides.id,
		name: overrides.name ?? "Cafe Demo",
		slug: overrides.slug,
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: overrides.subscriptionPlan ?? "basic",
		subscriptionPlanId: overrides.subscriptionPlanId ?? planBasicId,
		status: overrides.status ?? TenantStatus.Active,
		createdAt: overrides.createdAt ?? "2026-06-01T10:00:00.000Z",
	});
}

class MutableStubTenantRepository extends TenantRepository {
	private tenants = new Map<string, Tenant>();

	constructor(initial: Tenant[]) {
		super();
		for (const tenant of initial) {
			this.tenants.set(tenant.id, tenant);
		}
	}

	setTenant(tenant: Tenant): void {
		this.tenants.set(tenant.id, tenant);
	}

	async findAll(): Promise<Tenant[]> {
		return [...this.tenants.values()];
	}

	async findById(tenantId: string): Promise<Tenant | null> {
		return this.tenants.get(tenantId) ?? null;
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		return [...this.tenants.values()].find((tenant) => tenant.slug === slug) ?? null;
	}

	async updateStatus(tenantId: string, status: TenantStatus): Promise<Tenant | null> {
		const tenant = this.tenants.get(tenantId);
		if (!tenant) {
			return null;
		}

		const updated = Tenant.fromPrimitives({ ...tenant.toPrimitives(), status });
		this.tenants.set(tenantId, updated);

		return updated;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}

	async updatePlatformProfile(
		tenantId: string,
		profile: { name?: string; slug?: string },
	): Promise<Tenant | null> {
		const tenant = this.tenants.get(tenantId);
		if (!tenant) {
			return null;
		}

		const updated = Tenant.fromPrimitives({
			...tenant.toPrimitives(),
			...(profile.name !== undefined ? { name: profile.name } : {}),
			...(profile.slug !== undefined ? { slug: profile.slug } : {}),
		});
		this.tenants.set(tenantId, updated);

		return updated;
	}
}

class InMemoryBillingRepository extends TenantBillingRepository {
	constructor(private readonly tenantRepository: MutableStubTenantRepository) {
		super();
	}

	async savePlan(): Promise<void> {}

	async searchPlanByName(name: string): Promise<SubscriptionPlan | null> {
		if (name === "basic") {
			return planBasic;
		}

		if (name === "pro") {
			return planPro;
		}

		return null;
	}

	async searchPlanById(planId: string): Promise<SubscriptionPlan | null> {
		if (planId === planBasicId) {
			return planBasic;
		}

		if (planId === planProId) {
			return planPro;
		}

		return null;
	}

	async listActivePlans(): Promise<SubscriptionPlan[]> {
		return [planBasic, planPro];
	}

	async saveSubscription(): Promise<void> {}

	async searchActiveSubscription(): Promise<null> {
		return null;
	}

	async searchSubscriptionByStripeId(): Promise<null> {
		return null;
	}

	async updateSubscriptionStatus(): Promise<void> {}

	async linkTenantPlan(tenantId: string, planId: string): Promise<void> {
		const plan = await this.searchPlanById(planId);
		const tenant = await this.tenantRepository.findById(tenantId);

		if (!plan || !tenant) {
			return;
		}

		this.tenantRepository.setTenant(
			Tenant.fromPrimitives({
				...tenant.toPrimitives(),
				subscriptionPlanId: planId,
				subscriptionPlan: plan.name,
			}),
		);
	}
}

class InMemoryPlatformTenantDetailReadRepository extends PlatformTenantDetailReadRepository {
	constructor(
		private readonly tenantRepository: MutableStubTenantRepository,
		private readonly billingRepository: InMemoryBillingRepository,
	) {
		super();
	}

	async getById(id: string): Promise<PlatformTenantDetail | null> {
		const tenant = await this.tenantRepository.findById(id);
		if (!tenant) {
			return null;
		}

		return {
			tenant,
			owners: [{ userId: "owner-1", name: "Owner Demo", email: "owner@example.local" }],
			activity: { customersCount: 12, staffCount: 2, qrScansCount: 34 },
			availablePlans: await this.billingRepository.listActivePlans(),
		};
	}
}

async function main(): Promise<void> {
	const tenantRepo = new MutableStubTenantRepository([
		makeTenant({ id: tenantId, slug: "cafe-demo" }),
		makeTenant({ id: otherTenantId, slug: "cafe-ocupado", name: "Otro Cafe" }),
	]);
	const billingRepo = new InMemoryBillingRepository(tenantRepo);
	const detailRepo = new InMemoryPlatformTenantDetailReadRepository(tenantRepo, billingRepo);

	const getDetail = new GetPlatformTenantDetail(detailRepo);
	const updateTenant = new UpdatePlatformTenant(tenantRepo);
	const assignPlan = new AssignPlatformTenantSubscriptionPlan(tenantRepo, billingRepo);

	const detail = await getDetail.execute(tenantId);
	if (detail.owners.length !== 1 || detail.activity.customersCount !== 12) {
		console.error("❌ unexpected detail", detail);
		process.exit(1);
	}

	console.log("✅ GetPlatformTenantDetail returns owners + activity");

	const updated = await updateTenant.execute({ tenantId, name: "Cafe Demo Editado" });
	if (updated.name !== "Cafe Demo Editado") {
		console.error("❌ update name failed", updated);
		process.exit(1);
	}

	console.log("✅ UpdatePlatformTenant updates name");

	try {
		await updateTenant.execute({ tenantId, slug: "cafe-ocupado" });
		console.error("❌ expected TenantSlugAlreadyExists");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantSlugAlreadyExists)) {
			console.error("❌ unexpected slug conflict error", error);
			process.exit(1);
		}
	}

	console.log("✅ UpdatePlatformTenant rejects duplicate slug");

	const assigned = await assignPlan.execute({ tenantId, planId: planProId });
	if (assigned.plan.name !== "pro") {
		console.error("❌ assign plan failed", assigned);
		process.exit(1);
	}

	const resolvePlan = new ResolveTenantSubscriptionPlan(tenantRepo, billingRepo);
	const assertFeature = new AssertTenantPlanFeature(resolvePlan);

	await assertFeature.execute({ tenantId, feature: "promotions" });
	console.log("✅ AssignPlatformTenantSubscriptionPlan enables plan features (promotions)");

	try {
		await getDetail.execute("missing-tenant");
		console.error("❌ expected TenantNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof TenantNotFound)) {
			console.error("❌ unexpected not found error", error);
			process.exit(1);
		}
	}

	try {
		await assignPlan.execute({ tenantId, planId: "missing-plan" });
		console.error("❌ expected SubscriptionPlanNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof SubscriptionPlanNotFound)) {
			console.error("❌ unexpected plan error", error);
			process.exit(1);
		}
	}

	console.log("✅ verify:platform-admin-tenant-detail-use-case passed");
}

void main();
