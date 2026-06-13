/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CreateStampCampaignFromPlatformTemplate } from "../src/contexts/loyalty/stamp_campaigns/application/adopt/CreateStampCampaignFromPlatformTemplate";
import { CreateStampCampaign } from "../src/contexts/loyalty/stamp_campaigns/application/create/CreateStampCampaign";
import { PlatformCampaignTemplate } from "../src/contexts/platform/domain/PlatformCampaignTemplate";
import { PlatformCampaignTemplateNotFound } from "../src/contexts/platform/domain/PlatformCampaignTemplateNotFound";
import {
	type ListPlatformCampaignTemplatesParams,
	PlatformCampaignTemplateRepository,
} from "../src/contexts/platform/domain/PlatformCampaignTemplateRepository";
import { StampCampaign } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaign";
import { StampCampaignForbidden } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignForbidden";
import { StampCampaignRepository } from "../src/contexts/loyalty/stamp_campaigns/domain/StampCampaignRepository";
import { StampType } from "../src/contexts/loyalty/stamp_types/domain/StampType";
import { StampTypeRepository } from "../src/contexts/loyalty/stamp_types/domain/StampTypeRepository";
import { TenantRole } from "../src/contexts/tenants/memberships/domain/TenantRole";
import { Tenant } from "../src/contexts/tenants/tenants/domain/Tenant";
import { TenantRepository } from "../src/contexts/tenants/tenants/domain/TenantRepository";
import { TenantStatus } from "../src/contexts/tenants/tenants/domain/TenantStatus";

const tenantId = "00000000-0000-4000-8000-0000000000d1";
const stampTypeId = "stamp-type-cafe";

const activeTemplate = PlatformCampaignTemplate.fromPrimitives({
	id: "template-coffee",
	name: "10 cafés = 1 gratis",
	description: "Plantilla café",
	requiredStamps: 10,
	suggestedStampTypeLabel: "Café",
	visualTemplate: "coffee",
	cardBackgroundVariant: "coffee-photo",
	conditions: "Lunes a viernes",
	isActive: true,
	sortOrder: 1,
});

const inactiveTemplate = PlatformCampaignTemplate.fromPrimitives({
	id: "template-inactive",
	name: "Plantilla inactiva",
	description: "",
	requiredStamps: 5,
	suggestedStampTypeLabel: "Té",
	visualTemplate: "generic",
	cardBackgroundVariant: "coffee-minimal",
	conditions: "",
	isActive: false,
	sortOrder: 2,
});

class InMemoryPlatformCampaignTemplateRepository extends PlatformCampaignTemplateRepository {
	constructor(private readonly templates: PlatformCampaignTemplate[]) {
		super();
	}

	async list(params: ListPlatformCampaignTemplatesParams): Promise<PlatformCampaignTemplate[]> {
		if (params.activeOnly) {
			return this.templates.filter((template) => template.toPrimitives().isActive);
		}

		return this.templates;
	}

	async searchById(id: string): Promise<PlatformCampaignTemplate | null> {
		return this.templates.find((template) => template.toPrimitives().id === id) ?? null;
	}

	async save(): Promise<void> {}

	async maxSortOrder(): Promise<number> {
		return 0;
	}
}

class StubTenantRepository extends TenantRepository {
	async findAll(): Promise<Tenant[]> {
		return [
			Tenant.fromPrimitives({
				id: tenantId,
				name: "Adopt Verify Cafe",
				slug: "adopt-verify-cafe",
				logoUrl: "",
				primaryColor: "#7C3AED",
				secondaryColor: "#4F46E5",
				subscriptionPlan: "FREE",
				subscriptionPlanId: null,
				status: TenantStatus.Active,
				createdAt: new Date().toISOString(),
			}),
		];
	}

	async findById(id: string): Promise<Tenant | null> {
		return id === tenantId ? this.findAll().then((rows) => rows[0] ?? null) : null;
	}

	async updateStatus(): Promise<Tenant | null> {
		return null;
	}

	async updateBranding(): Promise<Tenant | null> {
		return null;
	}
}

class InMemoryStampTypeRepository extends StampTypeRepository {
	async save(): Promise<void> {}

	async searchById(typeTenantId: string, id: string): Promise<StampType | null> {
		if (typeTenantId !== tenantId || id !== stampTypeId) {
			return null;
		}

		return StampType.fromPrimitives({
			id: stampTypeId,
			tenantId,
			label: "Café",
			slug: "cafe",
			sortOrder: 1,
			isActive: true,
		});
	}

	async searchBySlug(): Promise<StampType | null> {
		return null;
	}

	async listByTenant(): Promise<StampType[]> {
		return [];
	}

	async listActiveByTenant(typeTenantId: string): Promise<StampType[]> {
		if (typeTenantId !== tenantId) {
			return [];
		}

		const type = await this.searchById(tenantId, stampTypeId);

		return type ? [type] : [];
	}

	async countActiveByTenant(typeTenantId: string): Promise<number> {
		return (await this.listActiveByTenant(typeTenantId)).length;
	}

	async maxSortOrder(): Promise<number> {
		return 1;
	}
}

class InMemoryStampCampaignRepository extends StampCampaignRepository {
	private campaigns = new Map<string, StampCampaign>();

	async saveCampaign(campaign: StampCampaign): Promise<void> {
		this.campaigns.set(campaign.id, campaign);
	}

	async deleteCampaign(): Promise<void> {}

	async searchCampaignById(): Promise<StampCampaign | null> {
		return null;
	}

	async listByTenant(typeTenantId: string): Promise<StampCampaign[]> {
		return Array.from(this.campaigns.values()).filter((campaign) => campaign.tenantId === typeTenantId);
	}
}

async function main(): Promise<void> {
	const templateRepository = new InMemoryPlatformCampaignTemplateRepository([
		activeTemplate,
		inactiveTemplate,
	]);
	const tenantRepository = new StubTenantRepository();
	const stampTypeRepository = new InMemoryStampTypeRepository();
	const stampCampaignRepository = new InMemoryStampCampaignRepository();
	const createStampCampaign = new CreateStampCampaign(
		tenantRepository,
		stampCampaignRepository,
		stampTypeRepository,
	);
	const adopt = new CreateStampCampaignFromPlatformTemplate(
		templateRepository,
		createStampCampaign,
	);

	const campaign = await adopt.execute({
		tenantId,
		role: TenantRole.Owner,
		templateId: activeTemplate.toPrimitives().id,
		stampTypeId,
	});
	const primitives = campaign.toPrimitives();

	if (
		primitives.name !== "10 cafés = 1 gratis" ||
		primitives.requiredStamps !== 10 ||
		primitives.stampTypeId !== stampTypeId ||
		primitives.visualTemplate !== "coffee" ||
		primitives.conditions !== "Lunes a viernes" ||
		!primitives.isActive
	) {
		console.error("❌ adopt maps template to tenant campaign", primitives);
		process.exit(1);
	}

	console.log("✅ CreateStampCampaignFromPlatformTemplate copies active template");

	try {
		await adopt.execute({
			tenantId,
			role: TenantRole.Owner,
			templateId: inactiveTemplate.toPrimitives().id,
			stampTypeId,
		});
		console.error("❌ expected inactive template to fail");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlatformCampaignTemplateNotFound)) {
			console.error("❌ unexpected inactive template error", error);
			process.exit(1);
		}
	}

	console.log("✅ inactive template → PlatformCampaignTemplateNotFound");

	try {
		await adopt.execute({
			tenantId,
			role: TenantRole.Employee,
			templateId: activeTemplate.toPrimitives().id,
			stampTypeId,
		});
		console.error("❌ expected employee forbidden");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof StampCampaignForbidden)) {
			console.error("❌ unexpected employee error", error);
			process.exit(1);
		}
	}

	console.log("✅ employee adopt → StampCampaignForbidden");
	console.log("✅ verify:stamp-campaign-adopt-template-use-case passed");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
