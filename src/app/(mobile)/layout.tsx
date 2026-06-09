import type { ReactElement, ReactNode } from "react";

import { PlatformAppShell } from "../_components/platform-app/PlatformAppShell";
import { PlatformCapacitorDeepLinkListener } from "../_components/platform-app/PlatformCapacitorDeepLinkListener";
import { PlatformGoogleOAuthProvider } from "../_components/platform-app/PlatformGoogleOAuthProvider";

/** Route group (mobile) — unified platform app shell at apex routes (/home, /join, …). */
export default function MobileAppLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<PlatformGoogleOAuthProvider>
			<PlatformCapacitorDeepLinkListener />
			<PlatformAppShell>{children}</PlatformAppShell>
		</PlatformGoogleOAuthProvider>
	);
}
