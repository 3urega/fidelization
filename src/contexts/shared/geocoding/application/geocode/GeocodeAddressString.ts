import { Service } from "diod";

import { env } from "../../../../../lib/env";
import { GeocodingGateway } from "../../domain/GeocodingGateway";
import { GeocodingResult } from "../../domain/GeocodingResult";
import { InvalidGeocodingAddress } from "../../domain/InvalidGeocodingAddress";

export type GeocodeAddressStringParams = {
	address: string;
};

@Service()
export class GeocodeAddressString {
	constructor(private readonly geocodingGateway: GeocodingGateway) {}

	async execute(params: GeocodeAddressStringParams): Promise<GeocodingResult> {
		const address = params.address.trim();

		if (!address) {
			throw new InvalidGeocodingAddress();
		}

		const coordinates = await this.geocodingGateway.geocodeAddress(address);

		return new GeocodingResult(coordinates, env.geocodingProvider, new Date());
	}
}
