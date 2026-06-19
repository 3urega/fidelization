export const DEFAULT_SEARCH_ZONE_MAP_ZOOM = 14;

const DEFAULT_EPSILON = 0.000001;

export type MapLatLng = {
	latitude: number;
	longitude: number;
};

export function mapLatLngNearlyEqual(
	a: MapLatLng,
	b: MapLatLng,
	epsilon = DEFAULT_EPSILON,
): boolean {
	return (
		Math.abs(a.latitude - b.latitude) <= epsilon &&
		Math.abs(a.longitude - b.longitude) <= epsilon
	);
}

export function toMapboxLngLat(center: MapLatLng): [number, number] {
	return [center.longitude, center.latitude];
}

export function fromMapboxLngLat(lng: number, lat: number): MapLatLng {
	return { latitude: lat, longitude: lng };
}

export function toGoogleLatLngLiteral(center: MapLatLng): { lat: number; lng: number } {
	return { lat: center.latitude, lng: center.longitude };
}
