"use client";

import { type ReactElement, Suspense } from "react";

import { StaffScanSessionLayout } from "../../../../_components/loyalty/StaffScanSessionLayout";
import { StaffScanSessionPlaceholderPanel } from "../../../../_components/loyalty/StaffScanSessionPlaceholderPanel";

function LoyaltyPanelContent(): ReactElement {
	return (
		<StaffScanSessionLayout
			title="Tarjetas y promociones"
			description="Registro de sellos y uso de promociones."
		>
			<StaffScanSessionPlaceholderPanel activityLabel="sellos y promociones" />
		</StaffScanSessionLayout>
	);
}

export function StaffScanSessionLoyaltyPageClient(): ReactElement {
	return (
		<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
			<LoyaltyPanelContent />
		</Suspense>
	);
}
