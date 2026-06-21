import { PlatformBroadcast } from "./PlatformBroadcast";

export type PlatformBroadcastListParams = {
	limit: number;
	offset: number;
};

export type PlatformBroadcastListPage = {
	broadcasts: PlatformBroadcast[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
};

export abstract class PlatformBroadcastRepository {
	abstract save(broadcast: PlatformBroadcast): Promise<void>;

	abstract updateStatus(broadcast: PlatformBroadcast): Promise<void>;

	abstract countRecentSentByCreator(params: {
		createdByUserId: string;
		since: Date;
	}): Promise<number>;

	abstract list(params: PlatformBroadcastListParams): Promise<PlatformBroadcastListPage>;
}
