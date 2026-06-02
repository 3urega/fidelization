import type { ReactElement } from "react";

import type { TenantAdminNavIcon } from "./navItems";

type NavIconProps = {
	icon: TenantAdminNavIcon;
	className?: string;
};

export function NavIcon({ icon, className = "h-5 w-5" }: NavIconProps): ReactElement {
	if (icon === "home") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
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
				d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
			/>
		</svg>
	);
}
