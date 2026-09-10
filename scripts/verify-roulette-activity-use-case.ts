/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

process.env.APP_TIMEZONE = "Europe/Madrid";

import { PlanFeatureNotAvailable } from "../src/contexts/billing/subscriptions/domain/PlanFeatureNotAvailable";
import {
	PREMIUM_PLAN_FEATURES,
	type SubscriptionPlanFeatures,
} from "../src/contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import { SubscriptionPlan } from "../src/contexts/billing/subscriptions/domain/SubscriptionPlan";
import { GetRouletteActivitySummary } from "../src/contexts/loyalty/games/application/activity/GetRouletteActivitySummary";
import { ListRouletteActivitySpins } from "../src/contexts/loyalty/games/application/activity/ListRouletteActivitySpins";
import { createDefaultRouletteConfigV2 } from "../src/contexts/loyalty/games/domain/RouletteConfig";
import { RouletteConfigForbidden } from "../src/contexts/loyalty/games/domain/RouletteConfigForbidden";
import { RouletteSpin } from "../src/contexts/loyalty/games/domain/RouletteSpin";
import {
	type ListRouletteSpinsByTenantBetweenOptions,
	RouletteSpinRepository,
} from "../src/contexts/loyalty/games/domain/RouletteSpinRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";
import { dayWindowForCalendarDate } from "../src/lib/time/zonedCalendarWindows";
import { mapSpinsByTenantBetween } from "./lib/roulette-spin-repository-test-helpers";

const tenantId = "00000000-0000-4000-8000-0000000000w1";
const customerA = "00000000-0000-4000-8000-0000000000w2";
const customerB = "00000000-0000-4000-8000-0000000000w3";
const segmentPhysical = "00000000-0000-4000-8000-000000000w01";
const segmentNone = "00000000-0000-4000-8000-000000000w02";
const referenceDate = new Date("2026-06-22T14:00:00.000Z");
const activityDate = "2026-06-22";

const configSnapshot = createDefaultRouletteConfigV2().toPrimitives();

class StubTenantRepository extends TenantRepository {
	constructor(private readonly tenant: Tenant) {
		super();
	}

	async findAll(): Promise<Tenant[]> {
		return [this.tenant];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === this.tenant.id ? this.tenant : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class ActivitySpinRepository extends RouletteSpinRepository {
	constructor(private readonly spins: RouletteSpin[]) {
		super();
	}

	async save(): Promise<void> {}

	async searchById(): Promise<null> {
		return null;
	}

	async countByCustomerSince(): Promise<number> {
		return 0;
	}

	async countByCustomerBetween(): Promise<number> {
		return 0;
	}

	async listPendingRedeemByCustomer(): Promise<never[]> {
		return [];
	}

	async listRecentByCustomer(): Promise<never[]> {
		return [];
	}

	async listByTenantBetween(
		tenantIdValue: string,
		start: Date,
		end: Date,
		options?: ListRouletteSpinsByTenantBetweenOptions,
	) {
		const names = new Map([
			[customerA, "Ana Demo"],
			[customerB, "Bruno Demo"],
		]);

		return mapSpinsByTenantBetween(this.spins, tenantIdValue, start, end, options, names);
	}
}

class StubAssertTenantPlanFeature {
	constructor(private readonly features: SubscriptionPlanFeatures) {}

	async execute(params: {
		tenantId: string;
		feature: "gamification" | "promotions";
	}): Promise<SubscriptionPlan> {
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

function buildSpin(params: {
	id: string;
	customerId: string;
	segmentId: string;
	segmentIndex: number;
	prizeType: "none" | "physical" | "points";
	label: string;
	createdAt: string;
}): RouletteSpin {
	return RouletteSpin.fromPrimitives({
		id: params.id,
		tenantId,
		customerId: params.customerId,
		segmentId: params.segmentId,
		segmentIndex: params.segmentIndex,
		prizeType: params.prizeType,
		prizePayload: params.prizeType === "points" ? { points: 5 } : {},
		status: params.prizeType === "physical" ? "pending_redeem" : "applied",
		triggerSource: "staff_scan",
		triggerRef: null,
		idempotencyKey: null,
		configSnapshot: {
			...configSnapshot,
			segments: [
				{
					id: segmentNone,
					label: "Sin premio",
					weight: 50,
					prizeType: "none",
					prize: {},
				},
				{
					id: segmentPhysical,
					label: params.label,
					weight: 50,
					prizeType: "physical",
					prize: { description: params.label },
				},
			],
		},
		createdAt: params.createdAt,
		redeemedAt: null,
	});
}

async function expectForbidden(
	label: string,
	run: () => Promise<unknown>,
): Promise<void> {
	try {
		await run();
		console.error(`❌ ${label} should throw`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof RouletteConfigForbidden)) {
			console.error(`❌ ${label} unexpected error`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label}`);
}

async function main(): Promise<void> {
	const tenant = Tenant.fromPrimitives({
		id: tenantId,
		name: "Activity Verify Cafe",
		slug: "activity-verify-cafe",
		logoUrl: "",
		primaryColor: "#7C3AED",
		secondaryColor: "#4F46E5",
		subscriptionPlan: "PREMIUM",
		subscriptionPlanId: null,
		status: TenantStatus.Active,
		createdAt: new Date().toISOString(),
	});

	const { start, end } = dayWindowForCalendarDate(activityDate, "Europe/Madrid");
	const spinInside = buildSpin({
		id: "00000000-0000-4000-8000-000000000s01",
		customerId: customerA,
		segmentId: segmentPhysical,
		segmentIndex: 1,
		prizeType: "physical",
		label: "Llavero",
		createdAt: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
	});
	const spinNone = buildSpin({
		id: "00000000-0000-4000-8000-000000000s02",
		customerId: customerB,
		segmentId: segmentNone,
		segmentIndex: 0,
		prizeType: "none",
		label: "Sin premio",
		createdAt: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
	});
	const spinOutside = buildSpin({
		id: "00000000-0000-4000-8000-000000000s03",
		customerId: customerA,
		segmentId: segmentPhysical,
		segmentIndex: 1,
		prizeType: "physical",
		label: "Llavero",
		createdAt: new Date(end.getTime() + 1000).toISOString(),
	});

	const spinRepository = new ActivitySpinRepository([spinInside, spinNone, spinOutside]);
	const tenantRepository = new StubTenantRepository(tenant);
	const assertFeature = new StubAssertTenantPlanFeature(PREMIUM_PLAN_FEATURES) as never;

	const summaryUseCase = new GetRouletteActivitySummary(
		tenantRepository,
		assertFeature,
		spinRepository,
	);
	const listUseCase = new ListRouletteActivitySpins(tenantRepository, assertFeature, spinRepository);

	await expectForbidden("employee forbidden on summary", () =>
		summaryUseCase.execute({
			tenantId,
			role: TenantRole.Employee,
			dateQuery: activityDate,
			referenceDate,
		}),
	);

	const summary = await summaryUseCase.execute({
		tenantId,
		role: TenantRole.Owner,
		dateQuery: activityDate,
		referenceDate,
	});

	if (summary.totalSpins !== 2 || summary.prizes.length !== 1) {
		console.error("❌ summary counts", summary);
		process.exit(1);
	}

	if (summary.prizes[0]?.label !== "Llavero" || summary.prizes[0]?.spinCount !== 1) {
		console.error("❌ summary prize row", summary.prizes);
		process.exit(1);
	}

	console.log("✅ GetRouletteActivitySummary aggregates day and excludes none prizes");

	const detail = await listUseCase.execute({
		tenantId,
		role: TenantRole.Owner,
		segmentId: segmentPhysical,
		dateQuery: activityDate,
		referenceDate,
	});

	if (detail.spins.length !== 1 || detail.spins[0]?.customerName !== "Ana Demo") {
		console.error("❌ ListRouletteActivitySpins detail", detail);
		process.exit(1);
	}

	console.log("✅ ListRouletteActivitySpins filters by segmentId");

	console.log("✅ verify:roulette-activity-use-case passed");
}

void main();
