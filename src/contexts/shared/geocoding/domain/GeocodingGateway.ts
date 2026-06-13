import { Coordinates } from "./Coordinates";

export abstract class GeocodingGateway {
	abstract geocodeAddress(address: string): Promise<Coordinates>;
}
