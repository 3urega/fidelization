import type { ReactElement, ReactNode } from "react";

import { PlatformNav } from "../_components/PlatformNav";

export const dynamic = "force-dynamic";

export default function PlatformLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<PlatformNav />
			{children}
		</>
	);
}
