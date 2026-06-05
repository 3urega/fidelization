import type { ReactElement, ReactNode } from "react";

type CustomerAppShellProps = {
	children: ReactNode;
};

/** Mobile-first shell for end-customer loyalty routes (/app). Not TenantAdminShell. */
export function CustomerAppShell({ children }: CustomerAppShellProps): ReactElement {
	return (
		<div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6">{children}</div>
	);
}
