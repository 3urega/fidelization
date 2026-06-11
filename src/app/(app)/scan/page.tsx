import type { ReactElement } from "react";

import { StaffScanForm } from "../../_components/loyalty/StaffScanForm";
import { PageHeader } from "../../_components/shell/PageHeader";
import { Card } from "../../_components/ui/Card";

export default function StaffScanPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Escanear cliente"
				description="Elige el tipo de consumición, escanea el QR y registra puntos y sellos en el carril correcto."
			/>
			<Card>
				<StaffScanForm />
			</Card>
		</div>
	);
}
