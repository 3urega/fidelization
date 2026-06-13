"use client";

import { type ReactElement, useState } from "react";

import {
	isStaffScanOutcome,
	type StaffScanOutcome,
} from "../../../contexts/loyalty/customers/domain/StaffScanOutcome";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { StaffScanOutcomesList } from "./StaffScanOutcomesList";
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

function parseOutcomes(value: unknown[] | undefined): StaffScanOutcome[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isStaffScanOutcome);
}

export function StaffScanForm(): ReactElement {
	const [qrValue, setQrValue] = useState("");
	const [selectedTarget, setSelectedTarget] = useState<StaffScanSelectedTarget | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [lastOutcomes, setLastOutcomes] = useState<StaffScanOutcome[]>([]);
	const [lastCustomer, setLastCustomer] = useState<ScanResponse["customer"] | null>(null);
	const [loading, setLoading] = useState(false);

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

			setLastOutcomes(parseOutcomes(body.outcomes));
			setLastCustomer(body.customer ?? null);
			setQrValue("");
		} catch {
			setError("Error de red al registrar la visita.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
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

			{lastOutcomes.length > 0 || lastCustomer ? (
				<StaffScanOutcomesList outcomes={lastOutcomes} customer={lastCustomer} />
			) : null}

			<Button
				type="submit"
				disabled={loading || !selectedTarget}
				className="w-full sm:w-auto"
			>
				{loading ? "Registrando…" : "Registrar visita"}
			</Button>
		</form>
	);
}
