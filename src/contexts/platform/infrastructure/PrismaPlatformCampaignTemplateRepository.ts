import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import {
	type StampCampaignCardBackgroundVariant,
	type StampCampaignVisualTemplate,
} from "../../loyalty/stamp_campaigns/domain/StampCampaignVisualAssets";
import { PlatformCampaignTemplate } from "../domain/PlatformCampaignTemplate";
import {
	type ListPlatformCampaignTemplatesParams,
	PlatformCampaignTemplateRepository,
} from "../domain/PlatformCampaignTemplateRepository";

@Service()
export class PrismaPlatformCampaignTemplateRepository extends PlatformCampaignTemplateRepository {
	async list(params: ListPlatformCampaignTemplatesParams): Promise<PlatformCampaignTemplate[]> {
		const rows = await prisma.platformCampaignTemplate.findMany({
			where: params.activeOnly ? { isActive: true } : undefined,
			orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
		});

		return rows.map((row) => this.toDomain(row));
	}

	async searchById(id: string): Promise<PlatformCampaignTemplate | null> {
		const row = await prisma.platformCampaignTemplate.findUnique({
			where: { id },
		});

		return row ? this.toDomain(row) : null;
	}

	async save(template: PlatformCampaignTemplate): Promise<void> {
		const primitives = template.toPrimitives();

		await prisma.platformCampaignTemplate.upsert({
			where: { id: primitives.id },
			create: {
				id: primitives.id,
				name: primitives.name,
				description: primitives.description,
				requiredStamps: primitives.requiredStamps,
				suggestedStampTypeLabel: primitives.suggestedStampTypeLabel,
				visualTemplate: primitives.visualTemplate,
				cardBackgroundVariant: primitives.cardBackgroundVariant,
				conditions: primitives.conditions,
				isActive: primitives.isActive,
				sortOrder: primitives.sortOrder,
			},
			update: {
				name: primitives.name,
				description: primitives.description,
				requiredStamps: primitives.requiredStamps,
				suggestedStampTypeLabel: primitives.suggestedStampTypeLabel,
				visualTemplate: primitives.visualTemplate,
				cardBackgroundVariant: primitives.cardBackgroundVariant,
				conditions: primitives.conditions,
				isActive: primitives.isActive,
				sortOrder: primitives.sortOrder,
			},
		});
	}

	async maxSortOrder(): Promise<number> {
		const row = await prisma.platformCampaignTemplate.findFirst({
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		return row?.sortOrder ?? 0;
	}

	private toDomain(row: {
		id: string;
		name: string;
		description: string;
		requiredStamps: number;
		suggestedStampTypeLabel: string;
		visualTemplate: string;
		cardBackgroundVariant: string;
		conditions: string;
		isActive: boolean;
		sortOrder: number;
	}): PlatformCampaignTemplate {
		return PlatformCampaignTemplate.fromPrimitives({
			id: row.id,
			name: row.name,
			description: row.description,
			requiredStamps: row.requiredStamps,
			suggestedStampTypeLabel: row.suggestedStampTypeLabel,
			visualTemplate: row.visualTemplate as StampCampaignVisualTemplate,
			cardBackgroundVariant: row.cardBackgroundVariant as StampCampaignCardBackgroundVariant,
			conditions: row.conditions,
			isActive: row.isActive,
			sortOrder: row.sortOrder,
		});
	}
}
