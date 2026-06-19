/* eslint-disable no-console -- CLI verify script */
import {
	DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	fromMapboxLngLat,
	mapLatLngNearlyEqual,
	toGoogleLatLngLiteral,
	toMapboxLngLat,
} from "../src/lib/maps/mapCenterUtils";

function assert(condition: boolean, message: string): void {
	if (!condition) {
		console.error(`❌ ${message}`);
		process.exit(1);
	}

	console.log(`✅ ${message}`);
}

function main(): void {
	assert(DEFAULT_SEARCH_ZONE_MAP_ZOOM === 14, "DEFAULT_SEARCH_ZONE_MAP_ZOOM is 14");

	const terrassa = { latitude: 41.5631, longitude: 2.0084 };
	const same = { latitude: 41.5631000001, longitude: 2.0084000001 };
	const different = { latitude: 41.57, longitude: 2.01 };

	assert(mapLatLngNearlyEqual(terrassa, same), "mapLatLngNearlyEqual accepts epsilon match");
	assert(!mapLatLngNearlyEqual(terrassa, different), "mapLatLngNearlyEqual rejects different coords");

	const lngLat = toMapboxLngLat(terrassa);
	assert(lngLat[0] === terrassa.longitude && lngLat[1] === terrassa.latitude, "toMapboxLngLat order");

	const roundTrip = fromMapboxLngLat(lngLat[0], lngLat[1]);
	assert(mapLatLngNearlyEqual(roundTrip, terrassa), "fromMapboxLngLat round trip");

	const googleLiteral = toGoogleLatLngLiteral(terrassa);
	assert(
		googleLiteral.lat === terrassa.latitude && googleLiteral.lng === terrassa.longitude,
		"toGoogleLatLngLiteral",
	);

	void import("../src/app/_components/platform-app/maps/types");
	void import("../src/app/_components/platform-app/maps/InteractiveSearchZoneMap");
	void import("../src/app/_components/platform-app/maps/MapboxInteractiveMap");
	void import("../src/app/_components/platform-app/maps/GoogleInteractiveMap");

	assert("InteractiveSearchZoneMap module exports load", "component modules importable");

	console.log("✅ verify:interactive-search-zone-map-component passed");
}

main();
