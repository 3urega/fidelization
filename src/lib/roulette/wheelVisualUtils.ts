import { segmentDisplayColor } from "./rouletteEditorUtils";

export type WheelSegmentVisual = {
	id: string;
	label: string;
	color?: string;
};

/** Equal-slice conic gradient for client wheel (weights not exposed in public API). */
export function buildEqualSliceConicGradient(segments: WheelSegmentVisual[]): string {
	if (segments.length === 0) {
		return "conic-gradient(var(--color-muted) 0deg 360deg)";
	}

	const sliceDegrees = 360 / segments.length;
	const stops: string[] = [];

	segments.forEach((segment, index) => {
		const start = index * sliceDegrees;
		const end = (index + 1) * sliceDegrees;
		const color = segmentDisplayColor(segment.color, index);
		stops.push(`${color} ${start}deg ${end}deg`);
	});

	return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

/** Polar position for icon/label at segment center (percent-based for CSS). */
export function segmentIconPosition(
	index: number,
	segmentCount: number,
	radiusPercent = 62,
): { left: string; top: string; rotate: string } {
	if (segmentCount <= 0) {
		return { left: "50%", top: "50%", rotate: "0deg" };
	}

	const sliceDegrees = 360 / segmentCount;
	const centerAngleDeg = index * sliceDegrees + sliceDegrees / 2;
	const centerAngleRad = ((centerAngleDeg - 90) * Math.PI) / 180;
	const x = 50 + radiusPercent * Math.cos(centerAngleRad);
	const y = 50 + radiusPercent * Math.sin(centerAngleRad);

	return {
		left: `${x}%`,
		top: `${y}%`,
		rotate: `${centerAngleDeg}deg`,
	};
}
