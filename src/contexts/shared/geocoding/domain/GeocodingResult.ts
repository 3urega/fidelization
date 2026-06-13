import { Coordinates, type CoordinatesPrimitives } from "./Coordinates";
import { type GeocodingProviderId } from "./GeocodingProvider";

export type GeocodingResultPrimitives = {
	coordinates: CoordinatesPrimitives;
	provider: GeocodingProviderId;
	geocodedAt: string;
};

export class GeocodingResult {
	constructor(
		public readonly coordinates: Coordinates,
		public readonly provider: GeocodingProviderId,
		public readonly geocodedAt: Date,
	) {}

	static fromPrimitives(primitives: GeocodingResultPrimitives): GeocodingResult {
		return new GeocodingResult(
			Coordinates.fromPrimitives(primitives.coordinates),
			primitives.provider,
			new Date(primitives.geocodedAt),
		);
	}

	toPrimitives(): GeocodingResultPrimitives {
		return {
			coordinates: this.coordinates.toPrimitives(),
			provider: this.provider,
			geocodedAt: this.geocodedAt.toISOString(),
		};
	}
}
