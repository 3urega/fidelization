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

	if (icon === "scan") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M12 4v1m6 2h-1M6 6H5m14 12v-1M6 18H5m12-8a4 4 0 11-8 0 4 4 0 018 0zM4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"
				/>
			</svg>
		);
	}

	if (icon === "customers") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
		);
	}

	if (icon === "palette") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
				/>
			</svg>
		);
	}

	if (icon === "stamps") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
				/>
			</svg>
		);
	}

	if (icon === "team") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
		);
	}

	if (icon === "promotions") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
				/>
			</svg>
		);
	}

	if (icon === "games") {
		return (
			<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		);
	}

	if (icon === "store") {
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
