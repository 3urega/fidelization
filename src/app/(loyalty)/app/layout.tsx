import type { ReactElement, ReactNode } from "react";

import { CustomerAppShell } from "../../_components/loyalty/CustomerAppShell";
import { ResolvedHostTenantTheme } from "../../_components/theme/ResolvedHostTenantTheme";

/** Route group (loyalty) maps to URL /app — distinct from (app) which maps to /home. */
export default function LoyaltyAppLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<ResolvedHostTenantTheme />
			<CustomerAppShell>{children}</CustomerAppShell>
		</>
	);
}
