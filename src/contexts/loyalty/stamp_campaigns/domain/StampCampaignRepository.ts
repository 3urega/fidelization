import { CustomerStampProgress } from "./CustomerStampProgress";
import { StampCampaign } from "./StampCampaign";

export abstract class StampCampaignRepository {
	abstract saveCampaign(campaign: StampCampaign): Promise<void>;

	abstract searchCampaignById(tenantId: string, id: string): Promise<StampCampaign | null>;

	abstract listByTenant(tenantId: string): Promise<StampCampaign[]>;

	abstract listActiveByTenant(tenantId: string): Promise<StampCampaign[]>;

	abstract saveProgress(progress: CustomerStampProgress): Promise<void>;

	abstract searchProgress(
		tenantId: string,
		customerId: string,
		campaignId: string,
	): Promise<CustomerStampProgress | null>;

	abstract hasActiveGenericCampaigns(tenantId: string): Promise<boolean>;
}
