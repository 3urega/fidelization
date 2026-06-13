import { Service } from "diod";

import {
	type PlatformOwnersListParams,
	type PlatformOwnersPage,
} from "../../domain/PlatformOwnerSummary";
import { PlatformOwnersReadRepository } from "../../domain/PlatformOwnersReadRepository";

export type ListPlatformOwnersParams = {
	offset?: number;
	page?: number;
	limit?: number;
	search?: string;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 50;

@Service()
export class ListPlatformOwners {
	constructor(private readonly repository: PlatformOwnersReadRepository) {}

	async execute(params: ListPlatformOwnersParams = {}): Promise<PlatformOwnersPage> {
		const limit = clampLimit(params.limit ?? DEFAULT_LIMIT);
		const offset =
			params.offset ??
			(params.page !== undefined ? params.page * limit : DEFAULT_OFFSET);

		const listParams: PlatformOwnersListParams = {
			offset: Math.max(0, offset),
			limit,
			search: params.search?.trim() || undefined,
		};

		return this.repository.list(listParams);
	}
}

function clampLimit(limit: number): number {
	if (!Number.isInteger(limit) || limit < 1) {
		return DEFAULT_LIMIT;
	}

	return Math.min(limit, MAX_LIMIT);
}
