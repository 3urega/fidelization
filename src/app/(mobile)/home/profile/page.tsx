import type { Metadata } from "next";
import { Suspense, type ReactElement } from "react";

import { parsePlatformProfileTab } from "../../../../lib/platform/routes";
import { PlatformHomeDashboardShell } from "../../../_components/platform-app/PlatformHomeDashboardShell";
import { PlatformUserProfileScreen } from "./PlatformUserProfileScreen";

export const metadata: Metadata = {
	title: "Perfil — App Fidelización",
};

type PlatformUserProfilePageProps = {
	searchParams: { tab?: string };
};

export default function PlatformUserProfilePage({
	searchParams,
}: PlatformUserProfilePageProps): ReactElement {
	const initialTab = parsePlatformProfileTab(searchParams.tab);

	return (
		<PlatformHomeDashboardShell>
			<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
				<PlatformUserProfileScreen initialTab={initialTab} />
			</Suspense>
		</PlatformHomeDashboardShell>
	);
}
