import { Service } from "diod";

import { DiscoverableEstablishmentsPage } from "../../domain/DiscoverableEstablishment";
import { TenantRepository } from "../../domain/TenantRepository";

export type ListDiscoverableEstablishmentsParams = {
	page?: number;
	limit?: number;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 0;

@Service()
export class ListDiscoverableEstablishments {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(params: ListDiscoverableEstablishmentsParams = {}): Promise<DiscoverableEstablishmentsPage> {
		const page = params.page ?? DEFAULT_PAGE;
		const limit = params.limit ?? DEFAULT_LIMIT;

		return this.tenantRepository.listDiscoverableActive({ page, limit });
	}
}
