import type { ReactElement, ReactNode } from "react";

import { PlatformMobileDashboardShell } from "../../../../_components/platform-app/PlatformMobileDashboardShell";
import { PLATFORM_ESTABLISHMENT_DETAIL_BACKGROUND_URL } from "../../../../../lib/platform/mobileDashboardBackground";

export default function PlatformEstablishmentLayout({
	children,
}: {
	children: ReactNode;
}): ReactElement {
	return (
		<PlatformMobileDashboardShell
			backgroundUrl={PLATFORM_ESTABLISHMENT_DETAIL_BACKGROUND_URL}
			backgroundRepeat="repeat"
			backgroundSize="auto"
			backgroundPosition="top left"
		>
			{children}
		</PlatformMobileDashboardShell>
	);
}
