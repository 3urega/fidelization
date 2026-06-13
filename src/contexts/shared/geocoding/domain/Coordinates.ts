import { InvalidCoordinates } from "./InvalidCoordinates";

export type CoordinatesPrimitives = {
	latitude: number;
	longitude: number;
};

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

function assertValidLatitude(latitude: number): void {
	if (!Number.isFinite(latitude) || latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
		throw new InvalidCoordinates(`latitude must be between ${MIN_LATITUDE} and ${MAX_LATITUDE}`);
	}
}

function assertValidLongitude(longitude: number): void {
	if (!Number.isFinite(longitude) || longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
		throw new InvalidCoordinates(`longitude must be between ${MIN_LONGITUDE} and ${MAX_LONGITUDE}`);
	}
}

export class Coordinates {
	constructor(
		public readonly latitude: number,
		public readonly longitude: number,
	) {
		assertValidLatitude(latitude);
		assertValidLongitude(longitude);
	}

	static fromPrimitives(primitives: CoordinatesPrimitives): Coordinates {
		return new Coordinates(primitives.latitude, primitives.longitude);
	}

	toPrimitives(): CoordinatesPrimitives {
		return {
			latitude: this.latitude,
			longitude: this.longitude,
		};
	}
}
