import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { CustomerStampProgress } from "../domain/CustomerStampProgress";
import { StampCampaign } from "../domain/StampCampaign";
import { StampCampaignRepository } from "../domain/StampCampaignRepository";

@Service()
export class PrismaStampCampaignRepository extends StampCampaignRepository {
	async saveCampaign(campaign: StampCampaign): Promise<void> {
		const p = campaign.toPrimitives();

		await prisma.stampCampaign.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				name: p.name,
				requiredStamps: p.requiredStamps,
				rewardId: p.rewardId,
				stampTypeId: p.stampTypeId,
				visualTemplate: p.visualTemplate,
				cardBackgroundVariant: p.cardBackgroundVariant,
				conditions: p.conditions,
				isActive: p.isActive,
			},
			update: {
				name: p.name,
				requiredStamps: p.requiredStamps,
				rewardId: p.rewardId,
				stampTypeId: p.stampTypeId,
				visualTemplate: p.visualTemplate,
				cardBackgroundVariant: p.cardBackgroundVariant,
				conditions: p.conditions,
				isActive: p.isActive,
			},
		});
	}

	async deleteCampaign(tenantId: string, campaignId: string): Promise<void> {
		await prisma.stampCampaign.deleteMany({
			where: { id: campaignId, tenantId },
		});
	}

	async searchCampaignById(tenantId: string, id: string): Promise<StampCampaign | null> {
		const row = await prisma.stampCampaign.findFirst({
			where: { id, tenantId },
		});

		return row ? this.toCampaign(row) : null;
	}

	async listByTenant(tenantId: string): Promise<StampCampaign[]> {
		const rows = await prisma.stampCampaign.findMany({
			where: { tenantId },
			orderBy: { createdAt: "desc" },
		});

		return rows.map((row) => this.toCampaign(row));
	}

	async listActiveByTenant(tenantId: string): Promise<StampCampaign[]> {
		const rows = await prisma.stampCampaign.findMany({
			where: { tenantId, isActive: true },
			orderBy: { createdAt: "desc" },
		});

		return rows.map((row) => this.toCampaign(row));
	}

	async hasActiveGenericCampaigns(tenantId: string): Promise<boolean> {
		const count = await prisma.stampCampaign.count({
			where: { tenantId, isActive: true, stampTypeId: null },
		});

		return count > 0;
	}

	async saveProgress(progress: CustomerStampProgress): Promise<void> {
		const p = progress.toPrimitives();

		await prisma.customerStampProgress.upsert({
			where: {
				customerId_campaignId: {
					customerId: p.customerId,
					campaignId: p.campaignId,
				},
			},
			create: {
				id: p.id,
				tenantId: p.tenantId,
				customerId: p.customerId,
				campaignId: p.campaignId,
				currentStamps: p.currentStamps,
				completed: p.completed,
			},
			update: {
				currentStamps: p.currentStamps,
				completed: p.completed,
			},
		});
	}

	async searchProgress(
		tenantId: string,
		customerId: string,
		campaignId: string,
	): Promise<CustomerStampProgress | null> {
		const row = await prisma.customerStampProgress.findFirst({
			where: { tenantId, customerId, campaignId },
		});

		return row ? this.toProgress(row) : null;
	}

	private toCampaign(row: {
		id: string;
		tenantId: string;
		name: string;
		requiredStamps: number;
		rewardId: string | null;
		stampTypeId: string | null;
		visualTemplate: string;
		cardBackgroundVariant: string;
		conditions: string;
		isActive: boolean;
	}): StampCampaign {
		return StampCampaign.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			name: row.name,
			requiredStamps: row.requiredStamps,
			rewardId: row.rewardId,
			stampTypeId: row.stampTypeId,
			visualTemplate: row.visualTemplate as StampCampaign["visualTemplate"],
			cardBackgroundVariant: row.cardBackgroundVariant as StampCampaign["cardBackgroundVariant"],
			conditions: row.conditions,
			isActive: row.isActive,
		});
	}

	private toProgress(row: {
		id: string;
		tenantId: string;
		customerId: string;
		campaignId: string;
		currentStamps: number;
		completed: boolean;
	}): CustomerStampProgress {
		return CustomerStampProgress.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			customerId: row.customerId,
			campaignId: row.campaignId,
			currentStamps: row.currentStamps,
			completed: row.completed,
		});
	}
}
