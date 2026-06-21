import type { ReactElement } from "react";

import { StaffScanForm } from "../../_components/loyalty/StaffScanForm";
import { StaffRoulettePendingRedeem } from "../../_components/loyalty/StaffRoulettePendingRedeem";
import { PageHeader } from "../../_components/shell/PageHeader";
import { Card } from "../../_components/ui/Card";

export default function StaffScanPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Escanear cliente"
				description="Elige la tarjeta o promoción, escanea el QR y registra la visita."
			/>
			<Card>
				<StaffScanForm />
			</Card>
			<StaffRoulettePendingRedeem />
		</div>
	);
}
