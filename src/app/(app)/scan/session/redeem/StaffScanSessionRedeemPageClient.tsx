"use client";

import { type ReactElement, Suspense } from "react";

import { StaffScanSessionLayout } from "../../../../_components/loyalty/StaffScanSessionLayout";
import { StaffScanSessionPlaceholderPanel } from "../../../../_components/loyalty/StaffScanSessionPlaceholderPanel";

function RedeemPanelContent(): ReactElement {
	return (
		<StaffScanSessionLayout
			title="Canjear premio físico (ruleta)"
			description="Entrega de premios físicos ya ganados."
		>
			<StaffScanSessionPlaceholderPanel activityLabel="canje de premios físicos" />
		</StaffScanSessionLayout>
	);
}

export function StaffScanSessionRedeemPageClient(): ReactElement {
	return (
		<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
			<RedeemPanelContent />
		</Suspense>
	);
}
