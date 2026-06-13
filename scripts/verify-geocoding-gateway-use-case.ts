/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GeocodeAddressString } from "../src/contexts/shared/geocoding/application/geocode/GeocodeAddressString";
import { Coordinates } from "../src/contexts/shared/geocoding/domain/Coordinates";
import { GeocodingFailed } from "../src/contexts/shared/geocoding/domain/GeocodingFailed";
import { GeocodingGateway } from "../src/contexts/shared/geocoding/domain/GeocodingGateway";
import { GeocodingNotConfigured } from "../src/contexts/shared/geocoding/domain/GeocodingNotConfigured";
import { InvalidGeocodingAddress } from "../src/contexts/shared/geocoding/domain/InvalidGeocodingAddress";

const BARCELONA_LAT = 41.3874;
const BARCELONA_LNG = 2.1686;

class SuccessStubGeocodingGateway extends GeocodingGateway {
	async geocodeAddress(_address: string): Promise<Coordinates> {
		return Coordinates.fromPrimitives({
			latitude: BARCELONA_LAT,
			longitude: BARCELONA_LNG,
		});
	}
}

class NotConfiguredStubGeocodingGateway extends GeocodingGateway {
	async geocodeAddress(_address: string): Promise<Coordinates> {
		throw new GeocodingNotConfigured("mapbox");
	}
}

class FailedStubGeocodingGateway extends GeocodingGateway {
	async geocodeAddress(_address: string): Promise<Coordinates> {
		throw new GeocodingFailed("No results");
	}
}

async function main(): Promise<void> {
	const successUseCase = new GeocodeAddressString(new SuccessStubGeocodingGateway());
	const result = await successUseCase.execute({
		address: "  Carrer Major 10, Igualada  ",
	});

	if (
		result.coordinates.latitude !== BARCELONA_LAT ||
		result.coordinates.longitude !== BARCELONA_LNG ||
		!(result.geocodedAt instanceof Date) ||
		Number.isNaN(result.geocodedAt.getTime())
	) {
		console.error("❌ success result", result.toPrimitives());
		process.exit(1);
	}

	console.log("✅ GeocodeAddressString returns coordinates and geocodedAt");

	try {
		await successUseCase.execute({ address: "   " });
		console.error("❌ empty address should throw InvalidGeocodingAddress");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidGeocodingAddress)) {
			console.error("❌ empty address wrong error", error);
			process.exit(1);
		}
	}

	console.log("✅ empty address → InvalidGeocodingAddress");

	const notConfiguredUseCase = new GeocodeAddressString(new NotConfiguredStubGeocodingGateway());

	try {
		await notConfiguredUseCase.execute({ address: "Calle Test 1" });
		console.error("❌ not configured should throw GeocodingNotConfigured");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof GeocodingNotConfigured)) {
			console.error("❌ not configured wrong error", error);
			process.exit(1);
		}
	}

	console.log("✅ gateway not configured → GeocodingNotConfigured");

	const failedUseCase = new GeocodeAddressString(new FailedStubGeocodingGateway());

	try {
		await failedUseCase.execute({ address: "Unknown place" });
		console.error("❌ geocoding failed should throw GeocodingFailed");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof GeocodingFailed)) {
			console.error("❌ geocoding failed wrong error", error);
			process.exit(1);
		}
	}

	console.log("✅ gateway failure → GeocodingFailed");
	console.log("✅ verify:geocoding-gateway-use-case passed");
}

void main();
