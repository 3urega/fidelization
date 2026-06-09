"use client";

import { type ReactElement, useState } from "react";

import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type StampAddedPayload = {
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
};

type ScanResponse = {
	customer?: {
		name: string;
		pointsBalance: number;
		visitsCount: number;
	};
	stampsAdded?: StampAddedPayload[];
	error?: {
		description?: string;
	};
};

function formatStampsAdded(stamps: StampAddedPayload[]): string {
	if (stamps.length === 0) {
		return "";
	}

	return stamps
		.map((stamp) => {
			const status = stamp.completed ? "completada" : `${stamp.current}/${stamp.required}`;

			return `Sello ${status} (${stamp.campaignName})`;
		})
		.join(" · ");
}

export function StaffScanForm(): ReactElement {
	const [qrValue, setQrValue] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);
		setSuccess(null);

		const trimmed = qrValue.trim();
		if (!trimmed) {
			setError("Introduce el código QR del cliente.");

			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/loyalty/scan", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ qrValue: trimmed }),
			});

			const body = (await response.json()) as ScanResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudo registrar la visita.");

				return;
			}

			if (body.customer) {
				const stampSummary = formatStampsAdded(body.stampsAdded ?? []);
				const baseMessage = `${body.customer.name}: +1 punto · total ${body.customer.pointsBalance} (${body.customer.visitsCount} visitas)`;
				setSuccess(stampSummary ? `${baseMessage} · ${stampSummary}` : baseMessage);
				setQrValue("");
			}
		} catch {
			setError("Error de red al registrar la visita.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
			<Field label="Código QR del cliente">
				<Input
					type="text"
					name="qrValue"
					value={qrValue}
					onChange={(event) => setQrValue(event.target.value)}
					placeholder="Pega el código o escanéalo"
					autoComplete="off"
					spellCheck={false}
				/>
				<p className="mt-1 text-xs text-muted">
					MVP: introduce el valor del QR manualmente. La cámara llegará en una fase posterior.
				</p>
			</Field>

			{error ? <p className="text-sm text-error">{error}</p> : null}
			{success ? <p className="text-sm text-foreground">{success}</p> : null}

			<Button type="submit" disabled={loading} className="w-full sm:w-auto">
				{loading ? "Registrando…" : "Registrar visita"}
			</Button>
		</form>
	);
}
