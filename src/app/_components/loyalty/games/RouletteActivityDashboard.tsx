"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import {
	type RouletteActivitySpinsResponse,
	type RouletteActivitySummaryResponse,
} from "../../../../lib/loyalty/rouletteActivityDashboard";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";

function formatSpinTime(iso: string): string {
	return new Date(iso).toLocaleString("es-ES", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function spinStatusLabel(status: string): string {
	switch (status) {
		case "pending_redeem":
			return "Pendiente de canje";
		case "applied":
			return "Aplicado";
		case "expired":
			return "Expirado";
		default:
			return status;
	}
}

export function RouletteActivityDashboard(): ReactElement {
	const [summary, setSummary] = useState<RouletteActivitySummaryResponse | null>(null);
	const [detail, setDetail] = useState<RouletteActivitySpinsResponse | null>(null);
	const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [detailLoading, setDetailLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadSummary = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);
		setDetail(null);
		setSelectedSegmentId(null);

		try {
			const response = await fetch("/api/loyalty/games/ruleta/activity/summary", {
				credentials: "include",
			});
			const body = (await response.json()) as RouletteActivitySummaryResponse & {
				error?: { description?: string };
			};

			if (!response.ok) {
				setSummary(null);
				setError(body.error?.description ?? "No se pudo cargar la actividad de la ruleta.");

				return;
			}

			setSummary(body);
		} catch {
			setSummary(null);
			setError("Error de red al cargar la actividad.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadSummary();
	}, [loadSummary]);

	const loadDetail = useCallback(async (segmentId: string, date: string): Promise<void> => {
		setDetailLoading(true);
		setSelectedSegmentId(segmentId);
		setError(null);

		try {
			const params = new URLSearchParams({ segmentId, date });
			const response = await fetch(
				`/api/loyalty/games/ruleta/activity/spins?${params.toString()}`,
				{ credentials: "include" },
			);
			const body = (await response.json()) as RouletteActivitySpinsResponse & {
				error?: { description?: string };
			};

			if (!response.ok) {
				setDetail(null);
				setError(body.error?.description ?? "No se pudo cargar el detalle del premio.");

				return;
			}

			setDetail(body);
		} catch {
			setDetail(null);
			setError("Error de red al cargar el detalle.");
		} finally {
			setDetailLoading(false);
		}
	}, []);

	if (loading) {
		return (
			<Card className="p-4">
				<p className="text-sm text-muted">Cargando actividad…</p>
			</Card>
		);
	}

	if (error && !summary) {
		return (
			<Card className="flex flex-col gap-3 p-4">
				<p className="text-sm text-error">{error}</p>
				<Button type="button" variant="secondary" onClick={() => void loadSummary()}>
					Reintentar
				</Button>
			</Card>
		);
	}

	const dateLabel = summary?.date ?? "";
	const totalSpins = summary?.totalSpins ?? 0;
	const prizes = summary?.prizes ?? [];

	return (
		<div className="flex flex-col gap-6">
			<Card className="p-4">
				<h2 className="font-medium text-foreground">Actividad del día</h2>
				<p className="mt-1 text-sm text-muted">
					{dateLabel}
					{summary?.timezone ? ` · ${summary.timezone}` : null}
				</p>
				<p className="mt-4 text-2xl font-semibold text-foreground">
					{totalSpins} {totalSpins === 1 ? "giro" : "giros"}
				</p>
				{totalSpins === 0 ? (
					<p className="mt-2 text-sm text-muted">Aún no hay giros registrados hoy.</p>
				) : null}
			</Card>

			{prizes.length > 0 ? (
				<section className="flex flex-col gap-3">
					<h3 className="text-sm font-medium text-foreground">Premios entregados</h3>
					<ul className="flex flex-col gap-2">
						{prizes.map((prize) => {
							const isSelected = selectedSegmentId === prize.segmentId;

							return (
								<li key={prize.segmentId}>
									<button
										type="button"
										className={`w-full rounded-theme border px-4 py-3 text-left transition-colors ${
											isSelected
												? "border-primary bg-primary/5"
												: "border-border bg-background hover:border-primary/40"
										}`}
										onClick={() => void loadDetail(prize.segmentId, dateLabel)}
									>
										<span className="font-medium text-foreground">{prize.label}</span>
										<span className="mt-1 block text-sm text-muted">
											{prize.spinCount}{" "}
											{prize.spinCount === 1 ? "premio" : "premios"} ·{" "}
											{prize.distinctCustomers}{" "}
											{prize.distinctCustomers === 1 ? "cliente" : "clientes"}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				</section>
			) : totalSpins > 0 ? (
				<Card className="p-4">
					<p className="text-sm text-muted">Hoy solo hubo giros sin premio.</p>
				</Card>
			) : null}

			{error && summary ? (
				<p className="text-sm text-error">{error}</p>
			) : null}

			{detailLoading ? (
				<Card className="p-4">
					<p className="text-sm text-muted">Cargando ganadores…</p>
				</Card>
			) : null}

			{detail && !detailLoading ? (
				<section className="flex flex-col gap-3">
					<h3 className="text-sm font-medium text-foreground">
						Ganadores — {detail.spins[0]?.segmentLabel ?? "Premio"}
					</h3>
					{detail.spins.length === 0 ? (
						<Card className="p-4">
							<p className="text-sm text-muted">Sin registros para este premio.</p>
						</Card>
					) : (
						<Card className="overflow-hidden p-0">
							<ul className="divide-y divide-border">
								{detail.spins.map((row) => (
									<li
										key={row.spinId}
										className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<Link
												href={`/customers/${row.customerId}`}
												className="font-medium text-primary hover:underline"
											>
												{row.customerName}
											</Link>
											<p className="text-xs text-muted">{formatSpinTime(row.createdAt)}</p>
										</div>
										<span className="text-muted">{spinStatusLabel(row.status)}</span>
									</li>
								))}
							</ul>
						</Card>
					)}
				</section>
			) : null}

			<Button type="button" variant="secondary" className="self-start" onClick={() => void loadSummary()}>
				Actualizar
			</Button>
		</div>
	);
}
