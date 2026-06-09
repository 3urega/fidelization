import type { ReactElement, ReactNode } from "react";

import { PlatformAppShell } from "../_components/platform-app/PlatformAppShell";

/** Route group (mobile) — platform app shell at /u/* (web coexistence prefix). */
export default function MobileAppLayout({ children }: { children: ReactNode }): ReactElement {
	return <PlatformAppShell>{children}</PlatformAppShell>;
}
