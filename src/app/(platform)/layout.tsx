import type { ReactElement, ReactNode } from "react";

import { PlatformAdminShell } from "../_components/platform/PlatformAdminShell";

export const dynamic = "force-dynamic";

export default function PlatformLayout({ children }: { children: ReactNode }): ReactElement {
	return <PlatformAdminShell>{children}</PlatformAdminShell>;
}
