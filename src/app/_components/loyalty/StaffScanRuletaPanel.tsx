"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

import type { StaffScanOutcome } from "../../../contexts/loyalty/customers/domain/StaffScanOutcome";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { recordStaffScanByTarget } from "./recordStaffScanByTarget";
import { StaffScanActionFeedback } from "./StaffScanActionFeedback";
import { StaffScanRouletteAuthorizeHint } from "./StaffScanRouletteHint";
import {
	rouletteParticipationDetailLines,
	rouletteParticipationStatusLabel,
} from "./staffScanRouletteParticipationCopy";
import type { StaffScanSessionData } from "./staffScanSessionTypes";

type StaffScanRuletaPanelProps = {
	session: StaffScanSessionData;
	pendingQrValue: string | null;
	onAfterAction: () => Promise<void>;
};

export function StaffScanRuletaPanel({
	session,
	pendingQrValue,
	onAfterAction,
}: StaffScanRuletaPanelProps): ReactElement {
	const rouletteCaps = session.tenantCapabilities.roulette;
	const participation = session.roulette?.participation;
	const customerId = session.customer.id;
	const canPerformActions = pendingQrValue !== null && pendingQrValue.trim() !== "";

	const [purchaseAmountEuros, setPurchaseAmountEuros] = useState("");
	const [authorizing, setAuthorizing] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [lastOutcomes, setLastOutcomes] = useState<StaffScanOutcome[]>([]);
	const [lastCustomer, setLastCustomer] = useState<{
		name: string;
		pointsBalance: number;
		visitsCount: number;
	} | null>(null);

	if (!rouletteCaps || !participation) {
		return (
			<p className="text-sm text-muted">
				La ruleta no está disponible en este local o plan.
			</p>
		);
	}

	async function handleAuthorize(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();

		if (!canPerformActions || !pendingQrValue) {
			setActionError("Identifica de nuevo al cliente desde Escanear QR para autorizar.");

			return;
		}

		const parsedAmount = Number.parseFloat(purchaseAmountEuros.replace(",", "."));

		if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
			setActionError("Introduce un importe válido en euros.");

			return;
		}

		setAuthorizing(true);
		setActionError(null);
		setLastOutcomes([]);
		setLastCustomer(null);

		const result = await recordStaffScanByTarget({
			qrValue: pendingQrValue,
			targetType: "roulette_authorize",
			purchaseAmountEuros: parsedAmount,
		});

		setAuthorizing(false);

		if (!result.ok) {
			setActionError(result.errorMessage);

			return;
		}

		setLastOutcomes(result.outcomes);
		setLastCustomer(result.customer);
		setPurchaseAmountEuros("");
		await onAfterAction();
	}

	const detailLines = rouletteParticipationDetailLines(participation);
	const loyaltyHref = `/scan/session/loyalty?c=${encodeURIComponent(customerId)}`;

	return (
		<div className="flex flex-col gap-5">
			{!canPerformActions ? (
				<div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
					Para autorizar un giro necesitas identificar al cliente con su QR.{" "}
					<Link href="/scan" className="text-primary underline">
						Volver a Escanear QR
					</Link>
				</div>
			) : null}

			<div className="rounded-xl border border-border bg-surface p-4">
				<h3 className="text-sm font-medium text-foreground">Estado del cliente</h3>
				<p className="mt-1 text-sm text-foreground">
					{rouletteParticipationStatusLabel(participation)}
				</p>
				{detailLines.length > 0 ? (
					<ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
						{detailLines.map((line) => (
							<li key={line}>{line}</li>
						))}
					</ul>
				) : null}
			</div>

			{rouletteCaps.unlockEnabled ? (
				<div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
					<p className="text-sm font-semibold text-foreground">Ruleta legacy (visita + unlock)</p>
					<p className="mt-1 text-sm text-muted">
						En este local también puedes desbloquear un giro al registrar la visita en una tarjeta o
						promoción.
					</p>
					<p className="mt-2 text-sm">
						<Link href={loyaltyHref} className="text-primary underline">
							Ir a tarjetas y promociones
						</Link>
					</p>
				</div>
			) : null}

			{actionError ? <p className="text-sm text-error">{actionError}</p> : null}

			<StaffScanActionFeedback outcomes={lastOutcomes} customer={lastCustomer} />

			{rouletteCaps.authorizeEnabled ? (
				<form className="flex flex-col gap-4" onSubmit={(event) => void handleAuthorize(event)}>
					<StaffScanRouletteAuthorizeHint minPurchaseEuros={rouletteCaps.minPurchaseEuros} />
					<Field label="Importe de la compra (€)">
						<Input
							type="text"
							inputMode="decimal"
							name="purchaseAmountEuros"
							value={purchaseAmountEuros}
							onChange={(event) => setPurchaseAmountEuros(event.target.value)}
							placeholder={
								rouletteCaps.minPurchaseEuros !== null
									? `Mínimo ${rouletteCaps.minPurchaseEuros}€`
									: "0.00"
							}
							autoComplete="off"
							disabled={authorizing || !canPerformActions}
						/>
					</Field>
					<Button
						type="submit"
						className="w-full sm:w-auto"
						disabled={
							authorizing ||
							!canPerformActions ||
							purchaseAmountEuros.trim() === ""
						}
					>
						{authorizing ? "Autorizando…" : "Autorizar giro de ruleta"}
					</Button>
				</form>
			) : (
				<p className="text-sm text-muted">
					La autorización explícita de ruleta no está activa en la configuración de este local.
				</p>
			)}
		</div>
	);
}
