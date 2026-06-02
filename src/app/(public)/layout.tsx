import type { ReactElement, ReactNode } from "react";

import { PublicNav } from "../_components/PublicNav";
import { ResolvedHostTenantTheme } from "../_components/theme/ResolvedHostTenantTheme";

export default function PublicLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<ResolvedHostTenantTheme />
			<PublicNav />
			{children}
		</>
	);
}
