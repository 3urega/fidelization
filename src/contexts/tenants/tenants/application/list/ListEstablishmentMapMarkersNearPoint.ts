import { Service } from "diod";

import type { EstablishmentMapMarker } from "../../domain/EstablishmentMapMarker";
import type { DiscoverNearFilter } from "../../domain/DiscoverNearFilter";
import { TenantRepository } from "../../domain/TenantRepository";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 50;

export type ListEstablishmentMapMarkersNearPointParams = {
	near: DiscoverNearFilter;
	limit?: number;
};

export type ListEstablishmentMapMarkersNearPointResult = {
	markers: EstablishmentMapMarker[];
};

@Service()
export class ListEstablishmentMapMarkersNearPoint {
	constructor(private readonly tenantRepository: TenantRepository) {}

	async execute(
		params: ListEstablishmentMapMarkersNearPointParams,
	): Promise<ListEstablishmentMapMarkersNearPointResult> {
		const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
		const markers = await this.tenantRepository.listEstablishmentMapMarkersNear(params.near, limit);

		return { markers };
	}
}
