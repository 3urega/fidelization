import { CustomerStampProgress } from "./CustomerStampProgress";
import { StampCampaign } from "./StampCampaign";

export abstract class StampCampaignRepository {
	abstract saveCampaign(campaign: StampCampaign): Promise<void>;

	abstract searchCampaignById(tenantId: string, id: string): Promise<StampCampaign | null>;

	abstract saveProgress(progress: CustomerStampProgress): Promise<void>;

	abstract searchProgress(
		tenantId: string,
		customerId: string,
		campaignId: string,
	): Promise<CustomerStampProgress | null>;
}
