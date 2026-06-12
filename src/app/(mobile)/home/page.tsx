import type { Metadata } from "next";
import { Suspense, type ReactElement } from "react";

import { parsePlatformHomeTab } from "../../../lib/platform/routes";
import { PlatformHomeDashboardShell } from "../../_components/platform-app/PlatformHomeDashboardShell";
import { PlatformUserDashboard } from "./PlatformUserDashboard";

export const metadata: Metadata = {
	title: "Inicio — App Fidelización",
};

type PlatformUserHomePageProps = {
	searchParams: { tab?: string };
};

export default function PlatformUserHomePage({
	searchParams,
}: PlatformUserHomePageProps): ReactElement {
	const initialTab = parsePlatformHomeTab(searchParams.tab);

	return (
		<PlatformHomeDashboardShell>
			<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
				<PlatformUserDashboard initialTab={initialTab} />
			</Suspense>
		</PlatformHomeDashboardShell>
	);
}
