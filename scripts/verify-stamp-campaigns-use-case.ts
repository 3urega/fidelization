/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CreateStampCampaign } from "../src/contexts/loyalty/stamp_campaigns/application/create/CreateStampCampaign";
import { ListStampCampaigns } from "../src/contexts/loyalty/stamp_campaigns/application/list/ListStampCampaigns";
import { UpdateStampCampaign } from "../src/contexts/loyalty/stamp_campaigns/application/update/UpdateStampCampaign";
import { InvalidStampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/InvalidStampCampaign";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignForbidden } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignForbidden";
import { StampCampaignNotFound } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignNotFound";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantNotFound } from "../src/contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000c1";

const baseTenant = Tenant.fromPrimitives({
	id: tenantId,
	name: "Stamp Verify Cafe",
	slug: "stamp-verify-cafe",
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

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	private campaigns = new Map<string, StampCampaign>();

	async saveCampaign(campaign: StampCampaign): Promise<void> {
		this.campaigns.set(campaign.id, campaign);
	}

	async searchCampaignById(tenantId: string, id: string): Promise<StampCampaign | null> {
		const campaign = this.campaigns.get(id);

		return campaign && campaign.tenantId === tenantId ? campaign : null;
	}

	async listByTenant(tenantId: string): Promise<StampCampaign[]> {
		return Array.from(this.campaigns.values()).filter((campaign) => campaign.tenantId === tenantId);
	}

	async listActiveByTenant(tenantId: string): Promise<StampCampaign[]> {
		return Array.from(this.campaigns.values()).filter(
			(campaign) => campaign.tenantId === tenantId && campaign.isActive,
		);
	}

	async saveProgress(): Promise<void> {}

	async searchProgress(): Promise<null> {
		return null;
	}

	async hasActiveGenericCampaigns(tenantId: string): Promise<boolean> {
		return Array.from(this.campaigns.values()).some(
			(campaign) =>
				campaign.tenantId === tenantId &&
				campaign.isActive &&
				campaign.stampTypeId === null,
		);
	}
}

class InMemoryStampTypeRepository extends StampTypeRepository {
	constructor(private readonly types: StampType[]) {
		super();
	}

	async save(stampType: StampType): Promise<void> {
		this.types.push(stampType);
	}

	async searchById(tenantId: string, id: string): Promise<StampType | null> {
		return this.types.find((type) => type.tenantId === tenantId && type.id === id) ?? null;
	}

	async searchBySlug(): Promise<null> {
		return null;
	}

	async listByTenant(tenantId: string): Promise<StampType[]> {
		return this.types.filter((type) => type.tenantId === tenantId);
	}

	async listActiveByTenant(tenantId: string): Promise<StampType[]> {
		return this.types.filter((type) => type.tenantId === tenantId && type.isActive);
	}

	async countActiveByTenant(tenantId: string): Promise<number> {
		return (await this.listActiveByTenant(tenantId)).length;
	}

	async maxSortOrder(): Promise<number> {
		return 0;
	}
}

async function expectForbidden(
	label: string,
	action: () => Promise<unknown>,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected StampCampaignForbidden for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof StampCampaignForbidden)) {
			console.error(`❌ wrong error for ${label}`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → StampCampaignForbidden`);
}

async function main(): Promise<void> {
	const tenantRepository = new StubTenantRepository(baseTenant);
	const stampRepository = new InMemoryStampCampaignRepository();
	const cafeType = StampType.create({
		tenantId,
		label: "Café",
		slug: "cafe",
		sortOrder: 1,
	});
	const stampTypeRepository = new InMemoryStampTypeRepository([cafeType]);
	const create = new CreateStampCampaign(tenantRepository, stampRepository, stampTypeRepository);
	const list = new ListStampCampaigns(tenantRepository, stampRepository);
	const update = new UpdateStampCampaign(tenantRepository, stampRepository);

	await expectForbidden("CreateStampCampaign employee", () =>
		create.execute({
			tenantId,
			role: TenantRole.Employee,
			input: { name: "Test", requiredStamps: 5 },
		}),
	);

	await expectForbidden("ListStampCampaigns employee", () =>
		list.execute({ tenantId, role: TenantRole.Employee }),
	);

	try {
		await create.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { name: "Missing type", requiredStamps: 5 },
		});
		console.error("❌ expected InvalidStampCampaign for missing stampTypeId");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampCampaign)) {
			console.error("❌ wrong error for missing stampTypeId", error);
			process.exit(1);
		}
	}

	console.log("✅ missing stampTypeId → InvalidStampCampaign");

	try {
		await create.execute({
			tenantId,
			role: TenantRole.Owner,
			input: {
				name: "Bad template",
				requiredStamps: 5,
				stampTypeId: cafeType.id,
				visualTemplate: "beer",
			},
		});
		console.error("❌ expected InvalidStampCampaign for invalid visualTemplate");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampCampaign)) {
			console.error("❌ wrong error for invalid visualTemplate", error);
			process.exit(1);
		}
	}

	console.log("✅ invalid visualTemplate → InvalidStampCampaign");

	const createNoTypes = new CreateStampCampaign(
		tenantRepository,
		stampRepository,
		new InMemoryStampTypeRepository([]),
	);

	try {
		await createNoTypes.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { name: "No types tenant", requiredStamps: 5, stampTypeId: cafeType.id },
		});
		console.error("❌ expected InvalidStampCampaign when no active stamp types");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampCampaign)) {
			console.error("❌ wrong error for no active stamp types", error);
			process.exit(1);
		}
	}

	console.log("✅ no active stamp types → InvalidStampCampaign");

	const created = await create.execute({
		tenantId,
		role: TenantRole.Owner,
		input: {
			name: "10 cafés → 1 gratis",
			requiredStamps: 10,
			stampTypeId: cafeType.id,
			visualTemplate: "coffee",
			cardBackgroundVariant: "coffee-pattern",
		},
	});

	if (
		!created.isActive ||
		created.requiredStamps !== 10 ||
		created.stampTypeId !== cafeType.id ||
		created.visualTemplate !== "coffee" ||
		created.cardBackgroundVariant !== "coffee-pattern"
	) {
		console.error("❌ CreateStampCampaign owner", created.toPrimitives());
		process.exit(1);
	}

	console.log("✅ CreateStampCampaign owner");

	const typed = await create.execute({
		tenantId,
		role: TenantRole.Owner,
		input: { name: "5 menús gratis", requiredStamps: 5, stampTypeId: cafeType.id },
	});

	if (typed.stampTypeId !== cafeType.id) {
		console.error("❌ CreateStampCampaign with stampTypeId", typed.toPrimitives());
		process.exit(1);
	}

	console.log("✅ CreateStampCampaign with stampTypeId");

	const campaigns = await list.execute({ tenantId, role: TenantRole.Owner });

	if (campaigns.length !== 2 || !campaigns.some((campaign) => campaign.id === typed.id)) {
		console.error("❌ ListStampCampaigns owner", campaigns);
		process.exit(1);
	}

	console.log("✅ ListStampCampaigns owner");

	await expectForbidden("UpdateStampCampaign employee", () =>
		update.execute({
			tenantId,
			role: TenantRole.Employee,
			campaignId: created.id,
			input: { isActive: false },
		}),
	);

	try {
		await update.execute({
			tenantId,
			role: TenantRole.Owner,
			campaignId: "missing-id",
			input: { isActive: false },
		});
		console.error("❌ expected StampCampaignNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof StampCampaignNotFound)) {
			console.error("❌ wrong error for missing campaign", error);
			process.exit(1);
		}
	}

	console.log("✅ missing campaign → StampCampaignNotFound");

	try {
		await update.execute({
			tenantId,
			role: TenantRole.Owner,
			campaignId: created.id,
			input: { isActive: true },
		});
		console.error("❌ expected InvalidStampCampaign for reactivation");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidStampCampaign)) {
			console.error("❌ wrong error for invalid patch", error);
			process.exit(1);
		}
	}

	console.log("✅ invalid patch → InvalidStampCampaign");

	const deactivated = await update.execute({
		tenantId,
		role: TenantRole.Owner,
		campaignId: created.id,
		input: { isActive: false },
	});

	if (deactivated.isActive) {
		console.error("❌ UpdateStampCampaign deactivate", deactivated.toPrimitives());
		process.exit(1);
	}

	console.log("✅ UpdateStampCampaign deactivate");

	const missingTenantCreate = new CreateStampCampaign(
		new StubTenantRepository(null),
		stampRepository,
		stampTypeRepository,
	);

	try {
		await missingTenantCreate.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { name: "X", requiredStamps: 1, stampTypeId: cafeType.id },
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
	console.log("✅ verify:stamp-campaigns-use-case passed");
}

void main();
