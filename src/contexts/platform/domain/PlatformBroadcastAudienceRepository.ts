import {
	type PlatformBroadcastAudience,
	type PlatformBroadcastRecipient,
} from "./PlatformBroadcastTypes";

export type PlatformBroadcastAudienceParams = {
	audienceType: PlatformBroadcastAudience;
	tenantId?: string | null;
};

export abstract class PlatformBroadcastAudienceRepository {
	abstract listRecipients(params: PlatformBroadcastAudienceParams): Promise<PlatformBroadcastRecipient[]>;

	abstract tenantExists(tenantId: string): Promise<boolean>;
}
