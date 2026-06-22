"use client";

import { type ReactElement, useState } from "react";

import {
	isStaffScanOutcome,
	type StaffScanOutcome,
} from "../../../contexts/loyalty/customers/domain/StaffScanOutcome";
import { formatStaffScanOutcomeMessage } from "../../../contexts/loyalty/customers/domain/StaffScanOutcome";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { StaffScanOutcomesList } from "./StaffScanOutcomesList";
import { StaffScanRouletteAuthorizeHint, StaffScanRouletteHint } from "./StaffScanRouletteHint";
import {
	StaffScanTargetPicker,
	type StaffScanSelectedTarget,
} from "./StaffScanTargetPicker";

type ScanResponse = {
	customer?: {
		name: string;
		pointsBalance: number;
		visitsCount: number;
	};
	outcomes?: unknown[];
	error?: {
		description?: string;
	};
};

export type StaffScanSuccessPayload = {
	qrValue: string;
	outcomes: StaffScanOutcome[];
	customer: ScanResponse["customer"] | null;
};

type StaffScanFormProps = {
	rouletteUnlockEnabled?: boolean;
	rouletteAuthorizeEnabled?: boolean;
	minPurchaseEuros?: number | null;
	onScanSuccess?: (payload: StaffScanSuccessPayload) => void;
};

function parseOutcomes(value: unknown[] | undefined): StaffScanOutcome[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isStaffScanOutcome);
}

function isRouletteAuthorizeTarget(
	target: StaffScanSelectedTarget | null,
): target is StaffScanSelectedTarget & { targetType: "roulette_authorize" } {
	return target?.targetType === "roulette_authorize";
}

export function StaffScanForm({
	rouletteUnlockEnabled = false,
	rouletteAuthorizeEnabled = false,
	minPurchaseEuros = null,
	onScanSuccess,
}: StaffScanFormProps): ReactElement {
	const [qrValue, setQrValue] = useState("");
	const [purchaseAmountEuros, setPurchaseAmountEuros] = useState("");
	const [selectedTarget, setSelectedTarget] = useState<StaffScanSelectedTarget | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [lastOutcomes, setLastOutcomes] = useState<StaffScanOutcome[]>([]);
	const [lastCustomer, setLastCustomer] = useState<ScanResponse["customer"] | null>(null);
	const [loading, setLoading] = useState(false);

	const authorizeMode = isRouletteAuthorizeTarget(selectedTarget);
	const rouletteOutcome = lastOutcomes.find((outcome) => outcome.kind === "roulette_spin_granted");
	const authGrantedOutcome = lastOutcomes.find((outcome) => outcome.kind === "roulette_auth_granted");
	const authDeniedOutcome = lastOutcomes.find((outcome) => outcome.kind === "roulette_auth_denied");

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);
		setLastOutcomes([]);
		setLastCustomer(null);

		const trimmed = qrValue.trim();
		if (!trimmed) {
			setError("Introduce el código QR del cliente.");

			return;
		}

		if (!selectedTarget) {
			setError("Elige una tarjeta, promoción o ruleta antes de escanear.");

			return;
		}

		let parsedAmount: number | undefined;

		if (authorizeMode) {
			parsedAmount = Number.parseFloat(purchaseAmountEuros.replace(",", "."));

			if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
				setError("Introduce un importe válido en euros.");

				return;
			}
		}

		setLoading(true);

		try {
			const body: Record<string, unknown> = {
				qrValue: trimmed,
				targetType: selectedTarget.targetType,
				targetId: selectedTarget.targetId,
			};

			if (authorizeMode) {
				body.purchaseAmountEuros = parsedAmount;
			}

			const response = await fetch("/api/loyalty/scan", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const responseBody = (await response.json()) as ScanResponse;

			if (!response.ok) {
				setError(responseBody.error?.description ?? "No se pudo completar el escaneo.");

				return;
			}

			const outcomes = parseOutcomes(responseBody.outcomes);
			const customer = responseBody.customer ?? null;

			setLastOutcomes(outcomes);
			setLastCustomer(customer);
			setQrValue("");

			if (authorizeMode) {
				setPurchaseAmountEuros("");
			}

			onScanSuccess?.({ qrValue: trimmed, outcomes, customer });
		} catch {
			setError("Error de red al registrar el escaneo.");
		} finally {
			setLoading(false);
		}
	}

	const submitLabel = authorizeMode
		? "Autorizar giro de ruleta"
		: rouletteUnlockEnabled
			? "Registrar visita y desbloquear ruleta"
			: "Registrar visita";

	const listOutcomes = lastOutcomes.filter(
		(outcome) =>
			outcome.kind !== "roulette_spin_granted" &&
			outcome.kind !== "roulette_auth_granted" &&
			outcome.kind !== "roulette_auth_denied",
	);

	return (
		<form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
			{rouletteUnlockEnabled && !authorizeMode ? <StaffScanRouletteHint /> : null}
			{authorizeMode ? <StaffScanRouletteAuthorizeHint minPurchaseEuros={minPurchaseEuros} /> : null}

			<StaffScanTargetPicker
				selectedTarget={selectedTarget}
				onSelectTarget={setSelectedTarget}
				disabled={loading}
			/>

			{authorizeMode ? (
				<Field label="Importe de la compra (€)">
					<Input
						type="text"
						inputMode="decimal"
						name="purchaseAmountEuros"
						value={purchaseAmountEuros}
						onChange={(event) => setPurchaseAmountEuros(event.target.value)}
						placeholder={minPurchaseEuros !== null ? `Mínimo ${minPurchaseEuros}€` : "0.00"}
						autoComplete="off"
						disabled={loading}
					/>
				</Field>
			) : null}

			<Field label="Código QR del cliente">
				<Input
					type="text"
					name="qrValue"
					value={qrValue}
					onChange={(event) => setQrValue(event.target.value)}
					placeholder="Pega el código o escanéalo"
					autoComplete="off"
					spellCheck={false}
					disabled={loading}
				/>
				<p className="mt-1 text-xs text-muted">
					MVP: introduce el valor del QR manualmente. La cámara llegará en una fase posterior.
				</p>
			</Field>

			{error ? <p className="text-sm text-error">{error}</p> : null}

			{rouletteOutcome ? (
				<div className="rounded-xl border-2 border-primary bg-primary/10 p-4">
					<p className="text-sm font-semibold text-primary">
						{formatStaffScanOutcomeMessage(rouletteOutcome)}
					</p>
					<p className="mt-1 text-sm text-foreground">
						Indica al cliente que abra la app y gire la ruleta en el detalle del local.
					</p>
				</div>
			) : null}

			{authGrantedOutcome ? (
				<div className="rounded-xl border-2 border-primary bg-primary/10 p-4">
					<p className="text-sm font-semibold text-primary">
						{formatStaffScanOutcomeMessage(authGrantedOutcome)}
					</p>
					<p className="mt-1 text-sm text-foreground">
						El cliente ya puede girar la ruleta en su app personal.
					</p>
				</div>
			) : null}

			{authDeniedOutcome ? (
				<div className="rounded-xl border-2 border-error bg-error/10 p-4">
					<p className="text-sm font-semibold text-error">
						{formatStaffScanOutcomeMessage(authDeniedOutcome)}
					</p>
				</div>
			) : null}

			{listOutcomes.length > 0 || (lastCustomer && !authorizeMode) ? (
				<StaffScanOutcomesList outcomes={listOutcomes} customer={lastCustomer} />
			) : null}

			{authorizeMode && lastCustomer ? (
				<p className="text-sm text-muted">
					{lastCustomer.name}
					{authGrantedOutcome || authDeniedOutcome ? "" : ` · ${lastCustomer.pointsBalance} puntos`}
				</p>
			) : null}

			<Button
				type="submit"
				disabled={loading || !selectedTarget || (authorizeMode && purchaseAmountEuros.trim() === "")}
				className="w-full sm:w-auto"
			>
				{loading ? (authorizeMode ? "Autorizando…" : "Registrando…") : submitLabel}
			</Button>
		</form>
	);
}
