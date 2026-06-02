import type { ReactElement } from "react";

import type { PlatformNavIcon } from "./platformNavItems";

type PlatformNavIconProps = {
	icon: PlatformNavIcon;
	className?: string;
};

export function PlatformNavIcon({
	icon,
	className = "h-5 w-5",
}: PlatformNavIconProps): ReactElement {
	if (icon === "building") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
				/>
			</svg>
		);
	}

	if (icon === "plans") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
				/>
			</svg>
		);
	}

	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
			/>
		</svg>
	);
}
