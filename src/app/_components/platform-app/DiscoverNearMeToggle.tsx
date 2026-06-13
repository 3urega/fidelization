"use client";

import { type ReactElement } from "react";

type DiscoverNearMeToggleProps = {
	enabled: boolean;
	loading?: boolean;
	onChange: (enabled: boolean) => void;
};

export function DiscoverNearMeToggle({
	enabled,
	loading = false,
	onChange,
}: DiscoverNearMeToggleProps): ReactElement {
	return (
		<button
			type="button"
			onClick={() => onChange(!enabled)}
			disabled={loading}
			className={[
				"rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60",
				enabled
					? "border-primary bg-primary/10 text-primary"
					: "border-border bg-surface text-muted hover:text-foreground",
			].join(" ")}
			aria-pressed={enabled}
			aria-busy={loading}
		>
			{loading ? "Obteniendo ubicación…" : "Cerca de mí"}
		</button>
	);
}
