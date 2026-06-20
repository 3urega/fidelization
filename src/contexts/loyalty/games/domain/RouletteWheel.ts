import { RouletteSegmentsExhausted } from "./RouletteSegmentsExhausted";
import { RouletteSegment } from "./RouletteSegment";

export type RandomNumberGenerator = () => number;

export type RouletteSegmentProbability = {
	segmentId: string;
	probability: number;
};

export type PickSegmentResult = {
	segment: RouletteSegment;
	/** Index in the original config segments array (stable for UI animation). */
	segmentIndex: number;
};

export function filterAvailableSegments(segments: RouletteSegment[]): RouletteSegment[] {
	return segments.filter((segment) => !segment.isStockExhausted());
}

export function computeSegmentProbabilities(
	segments: RouletteSegment[],
): RouletteSegmentProbability[] {
	const available = filterAvailableSegments(segments);

	if (available.length === 0) {
		return [];
	}

	const totalWeight = available.reduce(
		(sum, segment) => sum + segment.toPrimitives().weight,
		0,
	);

	return available.map((segment) => {
		const weight = segment.toPrimitives().weight;

		return {
			segmentId: segment.toPrimitives().id,
			probability: Math.round((weight / totalWeight) * 10_000) / 10_000,
		};
	});
}

/**
 * Picks a segment using weighted random selection over available (non-exhausted) segments.
 * `rng` must return a value in [0, 1).
 */
export function pickSegment(
	segments: RouletteSegment[],
	rng: RandomNumberGenerator,
): PickSegmentResult {
	const available = filterAvailableSegments(segments);

	if (available.length === 0) {
		throw new RouletteSegmentsExhausted();
	}

	const totalWeight = available.reduce(
		(sum, segment) => sum + segment.toPrimitives().weight,
		0,
	);

	let roll = rng() * totalWeight;

	for (const segment of available) {
		roll -= segment.toPrimitives().weight;

		if (roll <= 0) {
			const segmentIndex = segments.findIndex(
				(candidate) => candidate.toPrimitives().id === segment.toPrimitives().id,
			);

			if (segmentIndex < 0) {
				throw new RouletteSegmentsExhausted();
			}

			return { segment, segmentIndex };
		}
	}

	const last = available[available.length - 1];
	const segmentIndex = segments.findIndex(
		(candidate) => candidate.toPrimitives().id === last.toPrimitives().id,
	);

	return { segment: last, segmentIndex };
}
