"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import {
	loadPendingRouletteSpinsForStaff,
	redeemRouletteSpinForStaff,
	type StaffPendingRouletteSpin,
} from "../../../lib/loyalty/staffRoulettePendingRedeemClient";
import { Button } from "../ui/Button";
import type { StaffScanSessionData } from "./staffScanSessionTypes";

type StaffScanRedeemPanelProps = {
	session: StaffScanSessionData;
	pendingQrValue: string | null;
	onAfterRedeem: () => Promise<void>;
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

export function StaffScanRedeemPanel({
	session,
	pendingQrValue,
	onAfterRedeem,
}: StaffScanRedeemPanelProps): ReactElement {
	const canLoad = pendingQrValue !== null && pendingQrValue.trim() !== "";
	const sessionPendingCount = session.roulette?.pendingPhysicalCount ?? 0;

	const [pendingSpins, setPendingSpins] = useState<StaffPendingRouletteSpin[]>([]);
	const [loading, setLoading] = useState(false);
	const [redeemingSpinId, setRedeemingSpinId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loadedOnce, setLoadedOnce] = useState(false);

	const refreshPending = useCallback(async (): Promise<void> => {
		if (!canLoad || !pendingQrValue) {
			return;
		}

		setLoading(true);
		setError(null);

		const result = await loadPendingRouletteSpinsForStaff(pendingQrValue);

		setLoading(false);
		setLoadedOnce(true);

		if (!result.ok) {
			setPendingSpins([]);
			setError(result.errorMessage);

			return;
		}

		setPendingSpins(result.pendingSpins);
	}, [canLoad, pendingQrValue]);

	useEffect(() => {
		if (!canLoad) {
			return;
		}

		void refreshPending();
	}, [canLoad, refreshPending]);

	async function handleRedeem(spinId: string): Promise<void> {
		setError(null);
		setRedeemingSpinId(spinId);

		const result = await redeemRouletteSpinForStaff(spinId);

		setRedeemingSpinId(null);

		if (!result.ok) {
			setError(result.errorMessage);

			return;
		}

		await refreshPending();
		await onAfterRedeem();
	}

	if (!canLoad) {
		return (
			<div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
				Para ver premios pendientes identifica al cliente con su QR.{" "}
				<Link href="/scan" className="text-primary underline">
					Volver a Escanear QR
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-sm text-muted">
					Premios físicos pendientes según sesión:{" "}
					<span className="font-medium text-foreground">{sessionPendingCount}</span>
				</p>
				<Button
					type="button"
					variant="secondary"
					disabled={loading || redeemingSpinId !== null}
					onClick={() => void refreshPending()}
				>
					{loading ? "Actualizando…" : "Actualizar lista"}
				</Button>
			</div>

			{error ? <p className="text-sm text-error">{error}</p> : null}

			{loadedOnce && !loading && pendingSpins.length === 0 ? (
				<p className="text-sm text-muted">
					No hay premios físicos pendientes de entrega para este cliente.
				</p>
			) : null}

			{pendingSpins.length > 0 ? (
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
								onClick={() => void handleRedeem(spin.spinId)}
							>
								{redeemingSpinId === spin.spinId ? "Canjeando…" : "Marcar canjeado"}
							</Button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
