import type { GeocodingResult } from "../../../shared/geocoding/domain/GeocodingResult";
import type { GeocodingProviderId } from "../../../shared/geocoding/domain/GeocodingProvider";

export type TenantGeolocationPrimitives = {
	latitude: number;
	longitude: number;
	geocodingProvider: GeocodingProviderId;
	geocodedAt: string;
};

export class TenantGeolocation {
	constructor(
		public readonly latitude: number,
		public readonly longitude: number,
		public readonly geocodingProvider: GeocodingProviderId,
		public readonly geocodedAt: Date,
	) {}

	static fromGeocodingResult(result: GeocodingResult): TenantGeolocation {
		const coordinates = result.coordinates.toPrimitives();

		return new TenantGeolocation(
			coordinates.latitude,
			coordinates.longitude,
			result.provider,
			result.geocodedAt,
		);
	}

	static fromPrimitives(primitives: TenantGeolocationPrimitives): TenantGeolocation {
		return new TenantGeolocation(
			primitives.latitude,
			primitives.longitude,
			primitives.geocodingProvider,
			new Date(primitives.geocodedAt),
		);
	}

	toPrimitives(): TenantGeolocationPrimitives {
		return {
			latitude: this.latitude,
			longitude: this.longitude,
			geocodingProvider: this.geocodingProvider,
			geocodedAt: this.geocodedAt.toISOString(),
		};
	}
}
