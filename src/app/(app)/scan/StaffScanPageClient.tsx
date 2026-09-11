"use client";

import type { ReactElement } from "react";

import { StaffScanIdentifyStep } from "../../_components/loyalty/StaffScanIdentifyStep";
import { PageHeader } from "../../_components/shell/PageHeader";
import { Card } from "../../_components/ui/Card";

export function StaffScanPageClient(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Escanear cliente"
				description="Identifica al cliente con su QR. Después elige qué actividad gestionar."
			/>
			<Card>
				<StaffScanIdentifyStep />
			</Card>
		</div>
	);
}
