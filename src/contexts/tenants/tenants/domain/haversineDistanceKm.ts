const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
	latitude1: number,
	longitude1: number,
	latitude2: number,
	longitude2: number,
): number {
	const deltaLatitude = toRadians(latitude2 - latitude1);
	const deltaLongitude = toRadians(longitude2 - longitude1);
	const lat1 = toRadians(latitude1);
	const lat2 = toRadians(latitude2);

	const a =
		Math.sin(deltaLatitude / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;

	return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function roundDistanceKm(distanceKm: number): number {
	return Math.round(distanceKm * 10) / 10;
}
