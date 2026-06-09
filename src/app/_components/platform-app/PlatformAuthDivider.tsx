import type { ReactElement } from "react";

type PlatformAuthDividerProps = {
	label?: string;
};

export function PlatformAuthDivider({
	label = "o continúa con email",
}: PlatformAuthDividerProps): ReactElement {
	return (
		<div className="relative py-1" role="separator" aria-label={label}>
			<div className="absolute inset-0 flex items-center" aria-hidden>
				<div className="w-full border-t border-border" />
			</div>
			<p className="relative mx-auto w-fit bg-background px-3 text-xs text-muted">{label}</p>
		</div>
	);
}
