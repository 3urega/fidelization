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
import { StaffScanRouletteHint } from "./StaffScanRouletteHint";
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
	onScanSuccess?: (payload: StaffScanSuccessPayload) => void;
};

function parseOutcomes(value: unknown[] | undefined): StaffScanOutcome[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isStaffScanOutcome);
}

export function StaffScanForm({
	rouletteUnlockEnabled = false,
	onScanSuccess,
}: StaffScanFormProps): ReactElement {
	const [qrValue, setQrValue] = useState("");
	const [selectedTarget, setSelectedTarget] = useState<StaffScanSelectedTarget | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [lastOutcomes, setLastOutcomes] = useState<StaffScanOutcome[]>([]);
	const [lastCustomer, setLastCustomer] = useState<ScanResponse["customer"] | null>(null);
	const [loading, setLoading] = useState(false);

	const rouletteOutcome = lastOutcomes.find((outcome) => outcome.kind === "roulette_spin_granted");

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
			setError("Elige una tarjeta o promoción antes de escanear.");

			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/loyalty/scan", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					qrValue: trimmed,
					targetType: selectedTarget.targetType,
					targetId: selectedTarget.targetId,
				}),
			});

			const body = (await response.json()) as ScanResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudo registrar la visita.");

				return;
			}

			const outcomes = parseOutcomes(body.outcomes);
			const customer = body.customer ?? null;

			setLastOutcomes(outcomes);
			setLastCustomer(customer);
			setQrValue("");
			onScanSuccess?.({ qrValue: trimmed, outcomes, customer });
		} catch {
			setError("Error de red al registrar la visita.");
		} finally {
			setLoading(false);
		}
	}

	const submitLabel = rouletteUnlockEnabled
		? "Registrar visita y desbloquear ruleta"
		: "Registrar visita";

	return (
		<form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
			{rouletteUnlockEnabled ? <StaffScanRouletteHint /> : null}

			<StaffScanTargetPicker
				selectedTarget={selectedTarget}
				onSelectTarget={setSelectedTarget}
				disabled={loading}
			/>

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

			{lastOutcomes.length > 0 || lastCustomer ? (
				<StaffScanOutcomesList
					outcomes={lastOutcomes.filter((outcome) => outcome.kind !== "roulette_spin_granted")}
					customer={lastCustomer}
				/>
			) : null}

			<Button
				type="submit"
				disabled={loading || !selectedTarget}
				className="w-full sm:w-auto"
			>
				{loading ? "Registrando…" : submitLabel}
			</Button>
		</form>
	);
}
