import type { Metadata } from "next";
import { Suspense, type ReactElement } from "react";

import { PlatformHomeDashboardShell } from "../../../_components/platform-app/PlatformHomeDashboardShell";
import { PlatformSearchZoneMapScreen } from "./PlatformSearchZoneMapScreen";

export const metadata: Metadata = {
	title: "Mapa — App Fidelización",
};

export default function PlatformSearchZoneMapPage(): ReactElement {
	return (
		<PlatformHomeDashboardShell>
			<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
				<PlatformSearchZoneMapScreen />
			</Suspense>
		</PlatformHomeDashboardShell>
	);
}
