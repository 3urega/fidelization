import type { CSSProperties, ReactElement, ReactNode } from "react";

import {
	PLATFORM_HOME_CAFE_FOOTER_URL,
	PLATFORM_HOME_CAFE_HEADER_URL,
	PLATFORM_HOME_CAFE_MIDDLE_URL,
} from "../../../lib/platform/mobileDashboardBackground";

type PlatformHomeDashboardShellProps = {
	children: ReactNode;
};

const middleBackgroundStyle: CSSProperties = {
	backgroundImage: `url("${encodeURI(PLATFORM_HOME_CAFE_MIDDLE_URL)}")`,
	backgroundRepeat: "repeat-y",
	backgroundSize: "100% auto",
	backgroundPosition: "top center",
};

/**
 * `/home` shell: header image + vertically repeating middle + footer image.
 */
export function PlatformHomeDashboardShell({
	children,
}: PlatformHomeDashboardShellProps): ReactElement {
	return (
		<div className="-mx-4 -my-8 relative flex min-h-screen flex-1 flex-col px-4 py-8">
			<div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col">
				<img
					src={PLATFORM_HOME_CAFE_HEADER_URL}
					alt=""
					className="block w-full shrink-0"
					decoding="async"
				/>
				<div className="min-h-0 flex-1" style={middleBackgroundStyle} />
				<img
					src={PLATFORM_HOME_CAFE_FOOTER_URL}
					alt=""
					className="block w-full shrink-0"
					decoding="async"
				/>
			</div>
			<div className="relative z-10 flex flex-1 flex-col">{children}</div>
		</div>
	);
}
