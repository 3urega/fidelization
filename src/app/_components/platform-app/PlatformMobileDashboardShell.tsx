import type { CSSProperties, ReactElement, ReactNode } from "react";

import { PLATFORM_MOBILE_DASHBOARD_BACKGROUND_URL } from "../../../lib/platform/mobileDashboardBackground";

type PlatformMobileDashboardShellProps = {
	children: ReactNode;
};

/**
 * Bleeds into PlatformAppShell padding so the mobile dashboard background fills the viewport.
 */
export function PlatformMobileDashboardShell({
	children,
}: PlatformMobileDashboardShellProps): ReactElement {
	const backgroundStyle: CSSProperties = {
		backgroundImage: `url(${PLATFORM_MOBILE_DASHBOARD_BACKGROUND_URL})`,
		backgroundSize: "cover",
		backgroundPosition: "center top",
		backgroundRepeat: "no-repeat",
	};

	return (
		<div
			className="-mx-4 -my-8 flex min-h-screen flex-1 flex-col px-4 py-8"
			style={backgroundStyle}
		>
			{children}
		</div>
	);
}
