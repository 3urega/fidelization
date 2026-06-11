"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type StampAddedPayload = {
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
};

type StampTypeOption = {
	id: string;
	label: string;
	isActive: boolean;
};

type ScanOptionsResponse = {
	types?: StampTypeOption[];
	hasGenericCampaigns?: boolean;
	selectionRequired?: boolean;
};

type ScanResponse = {
	customer?: {
		name: string;
		pointsBalance: number;
		visitsCount: number;
	};
	stampsAdded?: StampAddedPayload[];
	selectedStampTypeLabel?: string | null;
	error?: {
		description?: string;
	};
};

const GENERAL_VISIT_VALUE = "__general__";

function formatStampsAdded(stamps: StampAddedPayload[]): string {
	if (stamps.length === 0) {
		return "Ninguna campaña activa para este tipo.";
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
	const [scanOptions, setScanOptions] = useState<ScanOptionsResponse | null>(null);
	const [selectedStampType, setSelectedStampType] = useState<string | null>(null);
	const [optionsLoading, setOptionsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const loadScanOptions = useCallback(async (): Promise<void> => {
		setOptionsLoading(true);

		try {
			const response = await fetch("/api/loyalty/stamp-types", {
				credentials: "include",
			});
			const body = (await response.json()) as ScanOptionsResponse;

			if (!response.ok) {
				setScanOptions(null);

				return;
			}

			setScanOptions(body);
		} catch {
			setScanOptions(null);
		} finally {
			setOptionsLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadScanOptions();
	}, [loadScanOptions]);

	const activeTypes = (scanOptions?.types ?? []).filter((type) => type.isActive);
	const selectionRequired = scanOptions?.selectionRequired ?? false;
	const hasGenericCampaigns = scanOptions?.hasGenericCampaigns ?? false;
	const showTypeSelector =
		selectionRequired && (activeTypes.length > 0 || hasGenericCampaigns);

	function resolveStampTypeIdForRequest(): string | null | undefined {
		if (!selectionRequired) {
			return undefined;
		}

		if (selectedStampType === GENERAL_VISIT_VALUE) {
			return null;
		}

		return selectedStampType;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);
		setSuccess(null);

		const trimmed = qrValue.trim();
		if (!trimmed) {
			setError("Introduce el código QR del cliente.");

			return;
		}

		if (showTypeSelector && selectedStampType === null) {
			setError("Elige qué ha consumido el cliente antes de registrar la visita.");

			return;
		}

		setLoading(true);

		try {
			const stampTypeId = resolveStampTypeIdForRequest();
			const payload: { qrValue: string; stampTypeId?: string | null } = { qrValue: trimmed };

			if (stampTypeId !== undefined) {
				payload.stampTypeId = stampTypeId;
			}

			const response = await fetch("/api/loyalty/scan", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const body = (await response.json()) as ScanResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudo registrar la visita.");

				return;
			}

			if (body.customer) {
				const typeLabel = body.selectedStampTypeLabel
					? ` · ${body.selectedStampTypeLabel}`
					: "";
				const stampSummary = formatStampsAdded(body.stampsAdded ?? []);
				const baseMessage = `${body.customer.name}${typeLabel}: +1 punto · total ${body.customer.pointsBalance} (${body.customer.visitsCount} visitas)`;
				setSuccess(`${baseMessage} · ${stampSummary}`);
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
			{optionsLoading ? (
				<p className="text-sm text-muted">Cargando tipos de consumición…</p>
			) : showTypeSelector ? (
				<Field label="¿Qué ha consumido el cliente?">
					<div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
						{activeTypes.map((type) => (
							<Button
								key={type.id}
								type="button"
								variant={selectedStampType === type.id ? "primary" : "secondary"}
								className="min-h-12 w-full"
								onClick={() => setSelectedStampType(type.id)}
							>
								{type.label}
							</Button>
						))}
						{hasGenericCampaigns ? (
							<Button
								type="button"
								variant={
									selectedStampType === GENERAL_VISIT_VALUE ? "primary" : "secondary"
								}
								className="min-h-12 w-full"
								onClick={() => setSelectedStampType(GENERAL_VISIT_VALUE)}
							>
								Visita general
							</Button>
						) : null}
					</div>
					<p className="mt-2 text-xs text-muted">
						El sello solo avanzará en la campaña que corresponda a esta elección.
					</p>
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
				/>
				<p className="mt-1 text-xs text-muted">
					MVP: introduce el valor del QR manualmente. La cámara llegará en una fase posterior.
				</p>
			</Field>

			{error ? <p className="text-sm text-error">{error}</p> : null}
			{success ? <p className="text-sm text-foreground">{success}</p> : null}

			<Button type="submit" disabled={loading || optionsLoading} className="w-full sm:w-auto">
				{loading ? "Registrando…" : "Registrar visita"}
			</Button>
		</form>
	);
}
