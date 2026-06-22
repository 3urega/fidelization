"use client";

import { type ReactElement, useState } from "react";

import { StaffScanForm } from "../../_components/loyalty/StaffScanForm";
import { StaffRoulettePendingRedeem } from "../../_components/loyalty/StaffRoulettePendingRedeem";
import { useStaffRouletteScanContext } from "../../_components/loyalty/useStaffRouletteScanContext";
import { PageHeader } from "../../_components/shell/PageHeader";
import { Card } from "../../_components/ui/Card";

export function StaffScanPageClient(): ReactElement {
	const { unlockEnabled, loading: contextLoading } = useStaffRouletteScanContext();
	const [lastScannedQr, setLastScannedQr] = useState<string | null>(null);

	const description = unlockEnabled
		? "Elige la tarjeta o promoción, escanea el QR y registra la visita para desbloquear la ruleta en la app del cliente."
		: "Elige la tarjeta o promoción, escanea el QR y registra la visita.";

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Escanear cliente" description={description} />
			<Card>
				<StaffScanForm
					rouletteUnlockEnabled={!contextLoading && unlockEnabled}
					onScanSuccess={({ qrValue }) => {
						setLastScannedQr(qrValue);
					}}
				/>
			</Card>
			<StaffRoulettePendingRedeem autoLookupQr={lastScannedQr} />
		</div>
	);
}
