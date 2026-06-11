import type { CSSProperties, ReactElement, ReactNode } from "react";

import {
	type LoyaltyCardBackgroundVariant,
	loyaltyCardBackgroundStyle,
	resolveLoyaltyCardBackground,
} from "./loyaltyCardBackgrounds";

type LoyaltyCardBackgroundProps = {
	variant?: LoyaltyCardBackgroundVariant | null;
	children: ReactNode;
	className?: string;
	/** When true, adds a readable overlay for text on top of the sprite. */
	withOverlay?: boolean;
};

export function LoyaltyCardBackground({
	variant,
	children,
	className = "",
	withOverlay = true,
}: LoyaltyCardBackgroundProps): ReactElement {
	const config = resolveLoyaltyCardBackground(variant);
	const backgroundStyle: CSSProperties = loyaltyCardBackgroundStyle(config.id);

	return (
		<div
			className={`relative overflow-hidden rounded-xl border border-border ${className}`.trim()}
			style={backgroundStyle}
			aria-label={`Fondo tarjeta: ${config.label}`}
		>
			{withOverlay ? (
				<div className="absolute inset-0 bg-surface/85 backdrop-blur-[1px]" aria-hidden />
			) : null}
			<div className="relative z-10 p-4">{children}</div>
		</div>
	);
}

export function LoyaltyCardBackgroundSwatch({
	variant,
	selected = false,
	onSelect,
}: {
	variant: LoyaltyCardBackgroundVariant;
	selected?: boolean;
	onSelect?: () => void;
}): ReactElement {
	const config = resolveLoyaltyCardBackground(variant);
	const backgroundStyle: CSSProperties = loyaltyCardBackgroundStyle(variant);

	const className = [
		"relative h-16 w-full overflow-hidden rounded-lg border-2 transition-opacity",
		selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:opacity-90",
	].join(" ");

	if (onSelect) {
		return (
			<button type="button" className={className} style={backgroundStyle} onClick={onSelect}>
				<span className="absolute inset-x-0 bottom-0 bg-background/80 px-1 py-0.5 text-center text-[10px] font-medium text-foreground">
					{config.label}
				</span>
			</button>
		);
	}

	return (
		<div className={className} style={backgroundStyle} title={config.label}>
			<span className="absolute inset-x-0 bottom-0 bg-background/80 px-1 py-0.5 text-center text-[10px] font-medium text-foreground">
				{config.label}
			</span>
		</div>
	);
}
