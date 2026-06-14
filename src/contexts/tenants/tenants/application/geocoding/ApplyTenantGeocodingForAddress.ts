import { Service } from "diod";

import { GeocodeAddressString } from "../../../../shared/geocoding/application/geocode/GeocodeAddressString";
import { GeocodingFailed } from "../../../../shared/geocoding/domain/GeocodingFailed";
import { GeocodingNotConfigured } from "../../../../shared/geocoding/domain/GeocodingNotConfigured";
import {
	type TenantGeocodingFailureCause,
	type TenantProfileGeocodingOutcome,
	tenantProfileGeocodingOutcome,
} from "../../domain/TenantProfileGeocodingOutcome";
import { TENANT_GEOCODING_STATUS } from "../../domain/TenantGeocodingStatus";
import { TenantGeolocation } from "../../domain/TenantGeolocation";

export type ApplyTenantGeocodingForAddressResult = {
	geolocation: TenantGeolocation | null;
	outcome: TenantProfileGeocodingOutcome;
};

@Service()
export class ApplyTenantGeocodingForAddress {
	constructor(private readonly geocodeAddressString: GeocodeAddressString) {}

	async execute(address: string): Promise<ApplyTenantGeocodingForAddressResult> {
		try {
			const result = await this.geocodeAddressString.execute({ address });

			return {
				geolocation: TenantGeolocation.fromGeocodingResult(result),
				outcome: tenantProfileGeocodingOutcome(TENANT_GEOCODING_STATUS.Ok),
			};
		} catch (error) {
			if (error instanceof GeocodingFailed || error instanceof GeocodingNotConfigured) {
				return {
					geolocation: null,
					outcome: tenantProfileGeocodingOutcome(
						TENANT_GEOCODING_STATUS.Failed,
						error as TenantGeocodingFailureCause,
					),
				};
			}

			throw error;
		}
	}
}
