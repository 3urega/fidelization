import type { ReactElement, ReactNode } from "react";

import { AppNav } from "../_components/AppNav";

export default function AppLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<AppNav />
			{children}
		</>
	);
}
