import type { CSSProperties, ReactElement } from "react";

import {
	parseLoyaltyVisualTemplate,
	resolveStampSprite,
	type LoyaltyStampSpriteState,
	type LoyaltyVisualTemplate,
} from "./loyaltyVisualTemplates";

export type LoyaltyProgressSlotState = LoyaltyStampSpriteState;

export type LoyaltyProgressProps = {
	template: LoyaltyVisualTemplate | string | null | undefined;
	current: number;
	required: number;
	completed?: boolean;
	className?: string;
};

/** Pure slot builder — reward appears only after all stamps are earned. */
export function buildLoyaltyProgressSlots(params: {
	current: number;
	required: number;
	completed?: boolean;
}): LoyaltyProgressSlotState[] {
	const { required, completed = false } = params;
	const current = completed ? required : Math.max(0, Math.min(params.current, required));
	const earnedAllStamps = completed || current >= required;
	const slots: LoyaltyProgressSlotState[] = [];

	for (let index = 1; index <= required; index += 1) {
		slots.push(index <= current ? "filled" : "empty");
	}

	if (earnedAllStamps) {
		slots.push("reward");
	}

	return slots;
}

const REWARD_GOLD = "#ca8a04";

function StampSpriteIcon({
	template,
	state,
	completed,
	className = "",
}: {
	template: LoyaltyVisualTemplate;
	state: LoyaltyProgressSlotState;
	completed: boolean;
	className?: string;
}): ReactElement {
	const asset = resolveStampSprite(template, state);
	const isEmpty = state === "empty";
	const isReward = state === "reward";

	const ringClass = [
		"inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white",
		"h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16",
		isReward ? "scale-110 md:scale-[1.12] lg:scale-[1.15]" : "",
		isReward && completed ? "animate-pulse" : "",
		className,
	].join(" ");

	const innerClass = "inline-block h-[72%] w-[72%]";

	if (asset.renderMode === "raster") {
		return (
			<span className={ringClass} aria-hidden>
				{/* eslint-disable-next-line @next/next/no-img-element -- static public PNG sprites */}
				<img src={asset.url} alt="" className={`${innerClass} object-contain`} />
			</span>
		);
	}

	const style: CSSProperties = {
		WebkitMaskImage: `url("${asset.url}")`,
		maskImage: `url("${asset.url}")`,
		WebkitMaskSize: "contain",
		maskSize: "contain",
		WebkitMaskRepeat: "no-repeat",
		maskRepeat: "no-repeat",
		WebkitMaskPosition: "center",
		maskPosition: "center",
		backgroundColor: isReward ? REWARD_GOLD : "var(--tenant-primary, var(--color-primary))",
		opacity: isEmpty ? 0.3 : 1,
	};

	return (
		<span className={ringClass} aria-hidden>
			<span className={innerClass} style={style} />
		</span>
	);
}

export function LoyaltyProgress({
	template,
	current,
	required,
	completed = false,
	className = "",
}: LoyaltyProgressProps): ReactElement | null {
	if (!Number.isFinite(required) || required < 1) {
		return null;
	}

	const resolvedTemplate = parseLoyaltyVisualTemplate(template ?? undefined);
	const slots = buildLoyaltyProgressSlots({ current, required, completed });
	const isCompleted = completed || current >= required;

	return (
		<div
			className={`flex flex-wrap items-center justify-center gap-0.5 md:gap-1 lg:gap-1.5 ${className}`.trim()}
			role="img"
			aria-label={`Progreso de sellos ${Math.min(current, required)} de ${required}${isCompleted ? ", premio desbloqueado" : ""}`}
		>
			{slots.map((state, index) => (
				<StampSpriteIcon
					key={`${resolvedTemplate}-${index}-${state}`}
					template={resolvedTemplate}
					state={state}
					completed={isCompleted}
				/>
			))}
		</div>
	);
}
