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
	const create = new CreateStampCampaign(tenantRepository, stampRepository);
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

	const created = await create.execute({
		tenantId,
		role: TenantRole.Owner,
		input: { name: "10 cafés → 1 gratis", requiredStamps: 10 },
	});

	if (!created.isActive || created.requiredStamps !== 10) {
		console.error("❌ CreateStampCampaign owner", created.toPrimitives());
		process.exit(1);
	}

	console.log("✅ CreateStampCampaign owner");

	const campaigns = await list.execute({ tenantId, role: TenantRole.Owner });

	if (campaigns.length !== 1 || campaigns[0]?.id !== created.id) {
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

	const missingTenantCreate = new CreateStampCampaign(new StubTenantRepository(null), stampRepository);

	try {
		await missingTenantCreate.execute({
			tenantId,
			role: TenantRole.Owner,
			input: { name: "X", requiredStamps: 1 },
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
