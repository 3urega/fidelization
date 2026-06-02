import type { ReactElement, ReactNode } from "react";

import { AuthNav } from "../_components/AuthNav";

export default function AuthLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<AuthNav />
			{children}
		</>
	);
}
