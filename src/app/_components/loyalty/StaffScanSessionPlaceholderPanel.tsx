import type { ReactElement } from "react";

type StaffScanSessionPlaceholderPanelProps = {
	activityLabel: string;
};

export function StaffScanSessionPlaceholderPanel({
	activityLabel,
}: StaffScanSessionPlaceholderPanelProps): ReactElement {
	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm text-foreground">
				La gestión de <span className="font-medium">{activityLabel}</span> estará disponible en la
				siguiente fase de implementación.
			</p>
			<p className="text-xs text-muted">
				Mientras tanto, vuelve al hub para ver el estado del cliente o escanea otro QR.
			</p>
		</div>
	);
}
