import type { ReactElement, ReactNode } from "react";

type PlatformAppShellProps = {
	children: ReactNode;
};

/** Mobile-first shell for unified platform app routes (apex). Not tenant or customer shells. */
export function PlatformAppShell({ children }: PlatformAppShellProps): ReactElement {
	return (
		<div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">{children}</div>
	);
}
