import { Suspense } from "react";

import { OwnerHomeTabs } from "./OwnerHomeTabs";

export default function OwnerHomePage(): React.ReactElement {
	return (
		<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
			<OwnerHomeTabs />
		</Suspense>
	);
}
