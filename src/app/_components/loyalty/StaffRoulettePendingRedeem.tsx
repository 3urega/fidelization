"use client";

import { type ReactElement, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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

export function StaffRoulettePendingRedeem(): ReactElement {
	const [qrValue, setQrValue] = useState("");
	const [customerName, setCustomerName] = useState<string | null>(null);
	const [pendingSpins, setPendingSpins] = useState<PendingSpin[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [redeemingSpinId, setRedeemingSpinId] = useState<string | null>(null);

	async function loadPending(trimmedQr: string): Promise<void> {
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
	}

	async function handleSearch(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);
		setCustomerName(null);
		setPendingSpins([]);

		const trimmed = qrValue.trim();
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
		}
	}

	async function handleRedeem(spinId: string): Promise<void> {
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

			const trimmed = qrValue.trim();
			if (trimmed) {
				await loadPending(trimmed);
			}
		} catch {
			setError("Error de red al canjear el premio.");
		} finally {
			setRedeemingSpinId(null);
		}
	}

	return (
		<Card>
			<form className="flex flex-col gap-4" onSubmit={(event) => void handleSearch(event)}>
				<div>
					<h2 className="text-lg font-semibold text-foreground">Premios ruleta pendientes</h2>
					<p className="mt-1 text-sm text-muted">
						Busca por QR del cliente los premios físicos pendientes de canje.
					</p>
				</div>

				<Field label="Código QR del cliente">
					<Input
						type="text"
						name="pendingQrValue"
						value={qrValue}
						onChange={(event) => setQrValue(event.target.value)}
						placeholder="Pega el código del cliente"
						autoComplete="off"
						spellCheck={false}
						disabled={loading || redeemingSpinId !== null}
					/>
				</Field>

				<Button type="submit" disabled={loading || redeemingSpinId !== null}>
					{loading ? "Buscando…" : "Buscar premios pendientes"}
				</Button>
			</form>

			{error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

			{customerName ? (
				<p className="mt-4 text-sm text-foreground">
					Cliente: <span className="font-medium">{customerName}</span>
				</p>
			) : null}

			{pendingSpins.length > 0 ? (
				<ul className="mt-4 flex flex-col gap-3">
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
								onClick={() => void handleRedeem(spin.spinId)}
							>
								{redeemingSpinId === spin.spinId ? "Canjeando…" : "Marcar canjeado"}
							</Button>
						</li>
					))}
				</ul>
			) : customerName ? (
				<p className="mt-4 text-sm text-muted">No hay premios físicos pendientes de canje.</p>
			) : null}
		</Card>
	);
}
