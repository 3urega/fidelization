"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type PendingSpin = {
	spinId: string;
	segmentLabel: string;
	prizeDescription: string | null;
	createdAt: string;
};

type PendingResponse = {
	customerId?: string;
	customerName?: string;
	pendingSpins?: PendingSpin[];
	error?: { description?: string };
};

type RedeemResponse = {
	spinId?: string;
	status?: string;
	redeemedAt?: string;
	error?: { type?: string; description?: string };
};

type StaffRoulettePendingRedeemProps = {
	autoLookupQr?: string | null;
};

function formatDate(value: string): string {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return date.toLocaleString("es-ES", {
		dateStyle: "short",
		timeStyle: "short",
	});
}

export function StaffRoulettePendingRedeem({
	autoLookupQr = null,
}: StaffRoulettePendingRedeemProps): ReactElement {
	const [manualQrValue, setManualQrValue] = useState("");
	const [customerName, setCustomerName] = useState<string | null>(null);
	const [pendingSpins, setPendingSpins] = useState<PendingSpin[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [redeemingSpinId, setRedeemingSpinId] = useState<string | null>(null);
	const [autoLookupDone, setAutoLookupDone] = useState(false);

	const loadPending = useCallback(async (trimmedQr: string): Promise<void> => {
		const response = await fetch(
			`/api/loyalty/games/ruleta/spins/pending?qrValue=${encodeURIComponent(trimmedQr)}`,
			{ credentials: "include" },
		);
		const body = (await response.json()) as PendingResponse;

		if (!response.ok) {
			throw new Error(body.error?.description ?? "No se pudieron cargar los premios pendientes.");
		}

		setCustomerName(body.customerName ?? null);
		setPendingSpins(body.pendingSpins ?? []);
	}, []);

	useEffect(() => {
		const trimmed = autoLookupQr?.trim();

		if (!trimmed) {
			return;
		}

		setError(null);
		setLoading(true);
		setAutoLookupDone(false);

		void loadPending(trimmed)
			.catch((lookupError) => {
				setCustomerName(null);
				setPendingSpins([]);
				setError(
					lookupError instanceof Error ? lookupError.message : "Error al buscar premios pendientes.",
				);
			})
			.finally(() => {
				setLoading(false);
				setAutoLookupDone(true);
			});
	}, [autoLookupQr, loadPending]);

	async function handleManualSearch(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);
		setCustomerName(null);
		setPendingSpins([]);

		const trimmed = manualQrValue.trim();
		if (!trimmed) {
			setError("Introduce el código QR del cliente.");

			return;
		}

		setLoading(true);

		try {
			await loadPending(trimmed);
		} catch (searchError) {
			setError(searchError instanceof Error ? searchError.message : "Error de red.");
		} finally {
			setLoading(false);
			setAutoLookupDone(true);
		}
	}

	async function handleRedeem(spinId: string, lookupQr: string): Promise<void> {
		setError(null);
		setRedeemingSpinId(spinId);

		try {
			const response = await fetch(`/api/loyalty/games/ruleta/spins/${spinId}/redeem`, {
				method: "POST",
				credentials: "include",
			});
			const body = (await response.json()) as RedeemResponse;

			if (!response.ok || body.status !== "applied") {
				setError(body.error?.description ?? "No se pudo marcar el premio como canjeado.");

				return;
			}

			if (lookupQr.trim()) {
				await loadPending(lookupQr.trim());
			}
		} catch {
			setError("Error de red al canjear el premio.");
		} finally {
			setRedeemingSpinId(null);
		}
	}

	const activeLookupQr = autoLookupQr?.trim() || manualQrValue.trim();

	return (
		<details className="rounded-xl border border-border/70 bg-surface/50">
			<summary className="cursor-pointer list-none px-4 py-4 marker:content-none">
				<div className="flex flex-col gap-1">
					<h2 className="text-base font-semibold text-foreground">
						Canjear premio físico (ruleta)
					</h2>
					<p className="text-sm text-muted">
						Solo si el cliente ya giró y ganó un premio físico pendiente de entrega. Para
						desbloquear un giro nuevo, usa el formulario de arriba.
					</p>
				</div>
			</summary>

			<div className="flex flex-col gap-4 border-t border-border px-4 pb-4 pt-4">
				{autoLookupDone && pendingSpins.length > 0 ? (
					<div className="flex flex-col gap-3">
						{customerName ? (
							<p className="text-sm text-foreground">
								Premios pendientes de{" "}
								<span className="font-medium">{customerName}</span>
							</p>
						) : null}
						<ul className="flex flex-col gap-3">
							{pendingSpins.map((spin) => (
								<li
									key={spin.spinId}
									className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div>
										<p className="font-medium text-foreground">{spin.segmentLabel}</p>
										{spin.prizeDescription ? (
											<p className="text-sm text-muted">{spin.prizeDescription}</p>
										) : null}
										<p className="text-xs text-muted">Ganado: {formatDate(spin.createdAt)}</p>
									</div>
									<Button
										type="button"
										variant="secondary"
										disabled={redeemingSpinId !== null}
										onClick={() => void handleRedeem(spin.spinId, activeLookupQr)}
									>
										{redeemingSpinId === spin.spinId ? "Canjeando…" : "Marcar canjeado"}
									</Button>
								</li>
							))}
						</ul>
					</div>
				) : autoLookupDone && customerName && pendingSpins.length === 0 ? (
					<p className="text-sm text-muted">
						No hay premios físicos pendientes de canje para este cliente.
					</p>
				) : null}

				<form className="flex flex-col gap-3" onSubmit={(event) => void handleManualSearch(event)}>
					<p className="text-xs text-muted">Buscar otro cliente o repetir búsqueda manualmente:</p>
					<Field label="Código QR del cliente">
						<Input
							type="text"
							name="pendingQrValue"
							value={manualQrValue}
							onChange={(event) => setManualQrValue(event.target.value)}
							placeholder="Pega el código del cliente"
							autoComplete="off"
							spellCheck={false}
							disabled={loading || redeemingSpinId !== null}
						/>
					</Field>
					<Button type="submit" variant="secondary" disabled={loading || redeemingSpinId !== null}>
						{loading ? "Buscando…" : "Buscar premios pendientes"}
					</Button>
				</form>

				{error ? <p className="text-sm text-error">{error}</p> : null}
			</div>
		</details>
	);
}
