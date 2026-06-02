import type { ReactElement, ReactNode } from "react";

import { AppNav } from "../_components/AppNav";
import { ResolvedHostTenantTheme } from "../_components/theme/ResolvedHostTenantTheme";

export default function AppLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<ResolvedHostTenantTheme />
			<AppNav />
			{children}
		</>
	);
}
