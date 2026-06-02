import type { ReactElement, ReactNode } from "react";

import { TenantAdminShell } from "../_components/shell/TenantAdminShell";
import { ResolvedHostTenantTheme } from "../_components/theme/ResolvedHostTenantTheme";

export default function AppLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<ResolvedHostTenantTheme />
			<TenantAdminShell>{children}</TenantAdminShell>
		</>
	);
}
