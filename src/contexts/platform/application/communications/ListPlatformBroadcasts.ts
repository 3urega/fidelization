import { Service } from "diod";

import { PlatformBroadcast } from "../../domain/PlatformBroadcast";
import {
	PlatformBroadcastRepository,
	type PlatformBroadcastListPage,
} from "../../domain/PlatformBroadcastRepository";

export type ListPlatformBroadcastsParams = {
	limit?: number;
	offset?: number;
};

@Service()
export class ListPlatformBroadcasts {
	constructor(private readonly repository: PlatformBroadcastRepository) {}

	async execute(params: ListPlatformBroadcastsParams = {}): Promise<PlatformBroadcastListPage> {
		const limit = params.limit ?? 20;
		const offset = params.offset ?? 0;

		return this.repository.list({ limit, offset });
	}
}

export type { PlatformBroadcast };
