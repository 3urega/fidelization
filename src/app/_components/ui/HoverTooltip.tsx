import type { ReactElement, ReactNode } from "react";

type HoverTooltipProps = {
	message: string | null;
	children: ReactNode;
	className?: string;
};

/** Tooltip bubble on hover. Use around disabled controls that do not receive pointer events. */
export function HoverTooltip({ message, children, className = "" }: HoverTooltipProps): ReactElement {
	if (!message) {
		return <>{children}</>;
	}

	return (
		<div className={`group relative ${className}`.trim()}>
			{children}
			<div
				role="tooltip"
				className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 w-max max-w-[min(calc(100vw-2rem),16rem)] -translate-x-1/2 rounded-theme border border-border bg-surface px-3 py-2 text-center text-xs leading-snug text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
			>
				{message}
				<span
					aria-hidden
					className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-border"
				/>
				<span
					aria-hidden
					className="absolute left-1/2 top-[calc(100%-1px)] -translate-x-1/2 border-[5px] border-transparent border-t-surface"
				/>
			</div>
		</div>
	);
}
