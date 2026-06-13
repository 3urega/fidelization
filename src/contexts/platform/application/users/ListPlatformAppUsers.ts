import { Service } from "diod";

import { env } from "../../../../lib/env";
import {
	parsePlatformAppUserFilter,
	type PlatformAppUsersPage,
} from "../../domain/PlatformAppUserSummary";
import { PlatformAppUsersReadRepository } from "../../domain/PlatformAppUsersReadRepository";

export type ListPlatformAppUsersParams = {
	offset?: number;
	page?: number;
	limit?: number;
	search?: string;
	filter?: string;
	referenceDate?: Date;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 50;

@Service()
export class ListPlatformAppUsers {
	constructor(private readonly repository: PlatformAppUsersReadRepository) {}

	async execute(params: ListPlatformAppUsersParams = {}): Promise<PlatformAppUsersPage> {
		const limit = clampLimit(params.limit ?? DEFAULT_LIMIT);
		const offset =
			params.offset ??
			(params.page !== undefined ? params.page * limit : DEFAULT_OFFSET);
		const filter = parsePlatformAppUserFilter(params.filter);
		const referenceDate = params.referenceDate ?? new Date();

		return this.repository.list({
			offset: Math.max(0, offset),
			limit,
			search: params.search?.trim() || undefined,
			filter,
			referenceDate,
			timezone: env.appTimezone,
		});
	}
}

function clampLimit(limit: number): number {
	if (!Number.isInteger(limit) || limit < 1) {
		return DEFAULT_LIMIT;
	}

	return Math.min(limit, MAX_LIMIT);
}
