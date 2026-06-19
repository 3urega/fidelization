import { Service } from "diod";

import { GeocodeAddressString } from "../../../../shared/geocoding/application/geocode/GeocodeAddressString";

export type GeocodeUserSearchZoneQueryParams = {
	query: string;
};

export type GeocodeUserSearchZoneQueryResult = {
	label: string;
	latitude: number;
	longitude: number;
};

@Service()
export class GeocodeUserSearchZoneQuery {
	constructor(private readonly geocodeAddressString: GeocodeAddressString) {}

	async execute(params: GeocodeUserSearchZoneQueryParams): Promise<GeocodeUserSearchZoneQueryResult> {
		const label = params.query.trim();
		const result = await this.geocodeAddressString.execute({ address: params.query });

		return {
			label,
			latitude: result.coordinates.latitude,
			longitude: result.coordinates.longitude,
		};
	}
}
