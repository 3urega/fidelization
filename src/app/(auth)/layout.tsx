import type { ReactElement, ReactNode } from "react";

import { AuthNav } from "../_components/AuthNav";
import { AuthTenantBanner } from "../_components/AuthTenantBanner";
import { ResolvedHostTenantTheme } from "../_components/theme/ResolvedHostTenantTheme";

export default function AuthLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<ResolvedHostTenantTheme />
			<AuthNav />
			<div className="mx-auto w-full max-w-md px-4">
				<AuthTenantBanner />
			</div>
			{children}
		</>
	);
}
