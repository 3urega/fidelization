"use client";

import { type ReactElement, Suspense } from "react";

import { StaffScanSessionLayout } from "../../../_components/loyalty/StaffScanSessionLayout";
import { StaffScanSessionPlaceholderPanel } from "../../../_components/loyalty/StaffScanSessionPlaceholderPanel";

function RuletaPanelContent(): ReactElement {
	return (
		<StaffScanSessionLayout title="Ruleta" description="Autorización y estado de participación.">
			<StaffScanSessionPlaceholderPanel activityLabel="ruleta" />
		</StaffScanSessionLayout>
	);
}

export function StaffScanSessionRuletaPageClient(): ReactElement {
	return (
		<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
			<RuletaPanelContent />
		</Suspense>
	);
}
