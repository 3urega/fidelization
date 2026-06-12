import type { CSSProperties, ReactElement, ReactNode } from "react";

import {
	PLATFORM_MOBILE_DASHBOARD_BACKGROUND_URL,
} from "../../../lib/platform/mobileDashboardBackground";

type PlatformMobileDashboardShellProps = {
	children: ReactNode;
	backgroundUrl?: string;
	backgroundSize?: CSSProperties["backgroundSize"];
	backgroundRepeat?: CSSProperties["backgroundRepeat"];
	backgroundPosition?: CSSProperties["backgroundPosition"];
};

/**
 * Bleeds into PlatformAppShell padding so the mobile dashboard background fills the viewport.
 */
export function PlatformMobileDashboardShell({
	children,
	backgroundUrl = PLATFORM_MOBILE_DASHBOARD_BACKGROUND_URL,
	backgroundSize = "cover",
	backgroundRepeat = "no-repeat",
	backgroundPosition = "center top",
}: PlatformMobileDashboardShellProps): ReactElement {
	const backgroundStyle: CSSProperties = {
		backgroundImage: `url("${encodeURI(backgroundUrl)}")`,
		backgroundSize,
		backgroundPosition,
		backgroundRepeat,
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
