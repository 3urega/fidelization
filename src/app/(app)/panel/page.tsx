import { Suspense } from "react";

import { HomeDashboard } from "./HomeDashboard";

export default function OwnerHomePage(): React.ReactElement {
	return (
		<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
			<HomeDashboard />
		</Suspense>
	);
}
