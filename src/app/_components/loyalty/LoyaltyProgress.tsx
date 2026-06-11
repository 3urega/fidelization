import type { CSSProperties, ReactElement } from "react";

import {
	getStampSpriteUrl,
	parseLoyaltyVisualTemplate,
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

/** Pure slot builder — last index is always reward; verify script tests this. */
export function buildLoyaltyProgressSlots(params: {
	current: number;
	required: number;
	completed?: boolean;
}): LoyaltyProgressSlotState[] {
	const { required, completed = false } = params;
	const current = completed ? required - 1 : Math.max(0, Math.min(params.current, required - 1));
	const slots: LoyaltyProgressSlotState[] = [];

	for (let index = 1; index <= required; index += 1) {
		if (index === required) {
			slots.push("reward");
			continue;
		}

		if (index <= current) {
			slots.push("filled");
			continue;
		}

		slots.push("empty");
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
	const url = getStampSpriteUrl(template, state);
	const isEmpty = state === "empty";
	const isReward = state === "reward";

	const style: CSSProperties = {
		WebkitMaskImage: `url("${url}")`,
		maskImage: `url("${url}")`,
		WebkitMaskSize: "contain",
		maskSize: "contain",
		WebkitMaskRepeat: "no-repeat",
		maskRepeat: "no-repeat",
		WebkitMaskPosition: "center",
		maskPosition: "center",
		backgroundColor: isReward ? REWARD_GOLD : "var(--tenant-primary, var(--color-primary))",
		opacity: isEmpty ? 0.3 : 1,
	};

	const wrapperClass = [
		"inline-block shrink-0",
		"h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16",
		isReward ? "scale-110 md:scale-[1.12] lg:scale-[1.15]" : "",
		isReward && completed ? "animate-pulse" : "",
		className,
	].join(" ");

	return <span className={wrapperClass} style={style} aria-hidden />;
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
	const isCompleted = completed || current >= required - 1;

	return (
		<div
			className={`flex flex-wrap items-center justify-center gap-0.5 md:gap-1 lg:gap-1.5 ${className}`.trim()}
			role="img"
			aria-label={`Progreso de sellos ${Math.min(current, Math.max(required - 1, 0))} de ${Math.max(required - 1, 0)}`}
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
