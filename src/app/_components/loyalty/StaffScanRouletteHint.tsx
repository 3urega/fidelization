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

type StaffScanRouletteAuthorizeHintProps = {
	minPurchaseEuros?: number | null;
};

export function StaffScanRouletteAuthorizeHint({
	minPurchaseEuros = null,
}: StaffScanRouletteAuthorizeHintProps): ReactElement {
	return (
		<div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
			<p className="text-sm font-semibold text-foreground">Autorizar giro de ruleta</p>
			<ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
				<li>Confirma que el cliente activó la ruleta en su app.</li>
				<li>Introduce el importe de la compra en caja.</li>
				<li>Pega o escanea el QR del cliente y pulsa autorizar.</li>
			</ol>
			{minPurchaseEuros !== null ? (
				<p className="mt-2 text-xs text-muted">Compra mínima para autorizar: {minPurchaseEuros}€</p>
			) : null}
			<p className="mt-2 text-xs text-muted">
				La visita y los sellos son independientes: si también quieres registrar la compra, hazlo
				con la tarjeta o promoción correspondiente.
			</p>
		</div>
	);
}
