import type { ReactElement, ReactNode } from "react";

import { PublicNav } from "../_components/PublicNav";

export default function PublicLayout({ children }: { children: ReactNode }): ReactElement {
	return (
		<>
			<PublicNav />
			{children}
		</>
	);
}
