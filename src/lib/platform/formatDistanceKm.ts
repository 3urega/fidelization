export function formatDistanceKm(distanceKm: number): string {
	const formatted = distanceKm.toLocaleString("es-ES", {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	});

	return `${formatted} km`;
}
