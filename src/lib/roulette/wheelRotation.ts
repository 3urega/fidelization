export type ComputeSpinRotationParams = {
	segmentIndex: number;
	segmentCount: number;
	minFullSpins?: number;
};

/**
 * Computes clockwise rotation (degrees) so segment `segmentIndex` center aligns under a fixed top pointer.
 * Uses equal visual slices (public API does not expose weights).
 */
export function computeSpinRotationDegrees(params: ComputeSpinRotationParams): number {
	const { segmentIndex, segmentCount, minFullSpins = 4 } = params;

	if (segmentCount <= 0) {
		return minFullSpins * 360;
	}

	const normalizedIndex = ((segmentIndex % segmentCount) + segmentCount) % segmentCount;
	const sliceDegrees = 360 / segmentCount;
	const segmentCenter = (normalizedIndex + 0.5) * sliceDegrees;

	return minFullSpins * 360 + (360 - segmentCenter);
}
