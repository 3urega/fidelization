import type { ReactElement } from "react";
import { Suspense } from "react";

import { StaffScanSessionPageClient } from "./StaffScanSessionPageClient";

export default function StaffScanSessionPage(): ReactElement {
	return (
		<Suspense
			fallback={
				<p className="text-sm text-muted">Cargando sesión…</p>
			}
		>
			<StaffScanSessionPageClient />
		</Suspense>
	);
}
