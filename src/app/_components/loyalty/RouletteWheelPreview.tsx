"use client";

import { type ReactElement } from "react";

import type { RouletteConfigPrimitives } from "../../../contexts/loyalty/games/domain/RouletteConfig";
import { RouletteSegment } from "../../../contexts/loyalty/games/domain/RouletteSegment";
import { computeSegmentProbabilities } from "../../../contexts/loyalty/games/domain/RouletteWheel";
import {
	buildConicGradient,
	formatProbabilityPercent,
	segmentDisplayColor,
} from "../../../lib/roulette/rouletteEditorUtils";

type RouletteWheelPreviewProps = {
	config: RouletteConfigPrimitives;
};

export function RouletteWheelPreview({ config }: RouletteWheelPreviewProps): ReactElement {
	const domainSegments = config.segments.map((segment) => RouletteSegment.fromPrimitives(segment));
	const probabilities = computeSegmentProbabilities(domainSegments);
	const probabilityById = new Map(probabilities.map((entry) => [entry.segmentId, entry.probability]));

	return (
		<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
			<div
				className="relative h-40 w-40 shrink-0 rounded-full border-4 border-border shadow-sm"
				style={{ background: buildConicGradient(config.segments) }}
				aria-hidden
			>
				<div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
			</div>
			<ul className="min-w-0 flex-1 space-y-2 text-sm">
				{config.segments.map((segment, index) => {
					const exhausted =
						segment.stockLimit !== null && segment.stockUsed >= segment.stockLimit;
					const probability = probabilityById.get(segment.id);

					return (
						<li key={segment.id} className="flex items-start gap-2">
							<span
								className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
								style={{ backgroundColor: segmentDisplayColor(segment.color, index) }}
							/>
							<span className="min-w-0 flex-1 text-foreground">
								<span className="font-medium">{segment.label}</span>
								<span className="text-muted">
									{" "}
									· peso {segment.weight}
									{probability !== undefined
										? ` · ${formatProbabilityPercent(probability)}`
										: exhausted
											? " · agotado"
											: ""}
								</span>
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
