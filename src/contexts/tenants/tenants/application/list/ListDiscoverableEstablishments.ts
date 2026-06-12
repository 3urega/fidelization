import { Service } from "diod";

import { DiscoverableEstablishmentsPage } from "../../domain/DiscoverableEstablishment";
import { TenantRepository } from "../../domain/TenantRepository";
import type { TenantDiscoveryTagId } from "../../domain/TenantDiscoveryTag";

export type ListDiscoverableEstablishmentsParams = {
	offset?: number;
	page?: number;
	limit?: number;
	tags?: TenantDiscoveryTagId[];
};

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

@Service()
export class ListDiscoverableEstablishments {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(params: ListDiscoverableEstablishmentsParams = {}): Promise<DiscoverableEstablishmentsPage> {
		const limit = params.limit ?? DEFAULT_LIMIT;
		const offset =
			params.offset ??
			(params.page !== undefined ? params.page * limit : DEFAULT_OFFSET);

		return this.tenantRepository.listDiscoverableActive({
			offset,
			limit,
			tags: params.tags,
		});
	}
}
