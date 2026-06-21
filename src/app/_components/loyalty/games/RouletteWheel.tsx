"use client";

import Image from "next/image";
import { type CSSProperties, type ReactElement, useEffect, useRef, useState } from "react";

import { computeSpinRotationDegrees } from "../../../../lib/roulette/wheelRotation";
import { buildEqualSliceConicGradient, segmentIconPosition } from "../../../../lib/roulette/wheelVisualUtils";
import { ROULETTE_WHEEL_ASSETS } from "./rouletteAssets";

const SPIN_DURATION_MS = 3500;

export type RouletteWheelSegment = {
	id: string;
	label: string;
	color?: string;
};

type RouletteWheelProps = {
	segments: RouletteWheelSegment[];
	tenantPrimaryColor?: string | null;
	spinning: boolean;
	targetSegmentIndex: number | null;
	onSpinComplete?: () => void;
	disabled?: boolean;
	onSpinRequest?: () => void;
};

export function RouletteWheel({
	segments,
	tenantPrimaryColor,
	spinning,
	targetSegmentIndex,
	onSpinComplete,
	disabled = false,
	onSpinRequest,
}: RouletteWheelProps): ReactElement {
	const [rotation, setRotation] = useState(0);
	const completedRef = useRef(false);
	const prefersReducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const wrapperStyle: CSSProperties | undefined = tenantPrimaryColor
		? ({ ["--tenant-primary" as string]: tenantPrimaryColor } as CSSProperties)
		: undefined;

	useEffect(() => {
		if (!spinning || targetSegmentIndex === null || segments.length === 0) {
			return;
		}

		completedRef.current = false;
		const targetRotation = computeSpinRotationDegrees({
			segmentIndex: targetSegmentIndex,
			segmentCount: segments.length,
		});

		if (prefersReducedMotion) {
			setRotation(targetRotation);
			onSpinComplete?.();
			return;
		}

		requestAnimationFrame(() => {
			setRotation((previous) => previous + targetRotation);
		});

		const timer = window.setTimeout(() => {
			if (!completedRef.current) {
				completedRef.current = true;
				onSpinComplete?.();
			}
		}, SPIN_DURATION_MS);

		return () => {
			window.clearTimeout(timer);
		};
	}, [spinning, targetSegmentIndex, segments.length, onSpinComplete, prefersReducedMotion]);

	const gradient = buildEqualSliceConicGradient(segments);

	return (
		<div className="relative mx-auto w-full max-w-[min(100%,320px)]" style={wrapperStyle}>
			<div
				className="pointer-events-none absolute inset-0 opacity-40"
				aria-hidden
				style={{
					backgroundImage: `url(${ROULETTE_WHEEL_ASSETS.modalBackdrop})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			/>

			<div className="relative aspect-square w-full">
				<div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1">
					<Image
						src={ROULETTE_WHEEL_ASSETS.pointer}
						alt=""
						width={40}
						height={50}
						className="h-10 w-8 drop-shadow-sm"
						aria-hidden
					/>
				</div>

				<div
					className="absolute inset-[6%] will-change-transform"
					style={{
						transform: `rotate(${rotation}deg)`,
						transition:
							spinning && !prefersReducedMotion
								? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.85, 0.2, 1)`
								: undefined,
					}}
				>
					<div
						className="absolute inset-0 rounded-full bg-cover bg-center shadow-md"
						style={{ backgroundImage: `url(${ROULETTE_WHEEL_ASSETS.backgroundPattern})` }}
						aria-hidden
					/>
					<div
						className="absolute inset-0 rounded-full border-2 border-border/30"
						style={{ background: gradient }}
						aria-hidden
					/>
					{segments.map((segment, index) => {
						const position = segmentIconPosition(index, segments.length);

						return (
							<span
								key={segment.id}
								className="absolute z-10 max-w-[22%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-[10px] font-semibold leading-tight text-foreground drop-shadow-sm"
								style={{
									left: position.left,
									top: position.top,
									transform: `translate(-50%, -50%) rotate(${position.rotate})`,
								}}
							>
								{segment.label}
							</span>
						);
					})}
				</div>

				<div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
					<Image
						src={ROULETTE_WHEEL_ASSETS.outerRing}
						alt=""
						fill
						className="object-contain"
						sizes="320px"
					/>
				</div>

				<button
					type="button"
					className="absolute left-1/2 top-1/2 z-30 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full disabled:opacity-60 relative"
					disabled={disabled || spinning}
					onClick={onSpinRequest}
					aria-label="Girar ruleta"
				>
					<Image
						src={ROULETTE_WHEEL_ASSETS.centerButton}
						alt=""
						fill
						className="object-contain drop-shadow-md"
						sizes="90px"
					/>
				</button>
			</div>
		</div>
	);
}
