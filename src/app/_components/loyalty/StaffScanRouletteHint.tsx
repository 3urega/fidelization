import type { ReactElement } from "react";

export function StaffScanRouletteHint(): ReactElement {
	return (
		<div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
			<p className="text-sm font-semibold text-foreground">Cliente quiere girar la ruleta</p>
			<ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
				<li>Elige la tarjeta o promoción de la visita.</li>
				<li>Pega o escanea el QR del cliente.</li>
				<li>Pulsa «Registrar visita y desbloquear ruleta».</li>
			</ol>
			<p className="mt-2 text-xs text-muted">
				El cliente podrá girar en su app personal. Aquí solo registras la visita y desbloqueas el
				giro.
			</p>
		</div>
	);
}
