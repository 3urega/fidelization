"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import type { PlatformAnalyticsSummaryResponse } from "../../../lib/platform/analytics";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { PlatformAnalyticsKpiGrid } from "./PlatformAnalyticsKpiGrid";
import { PlatformAnalyticsTopTenantsTable } from "./PlatformAnalyticsTopTenantsTable";

type PeriodDays = 7 | 30;

export function PlatformAnalyticsPanel(): ReactElement {
	const [periodDays, setPeriodDays] = useState<PeriodDays>(7);
	const [summary, setSummary] = useState<PlatformAnalyticsSummaryResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (days: PeriodDays): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/platform/analytics/summary?periodDays=${days}`, {
				credentials: "include",
			});

			if (!response.ok) {
				setError("No se pudo cargar la analítica de plataforma");
				setSummary(null);

				return;
			}

			const data = (await response.json()) as PlatformAnalyticsSummaryResponse;
			setSummary(data);
		} catch {
			setError("No se pudo conectar con el servidor");
			setSummary(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load(periodDays);
	}, [load, periodDays]);

	if (loading) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Analítica</h2>
				<p className="mt-2 text-sm text-muted">
					Cargando Últimos 7 días y Top negocios…
				</p>
			</Card>
		);
	}

	if (error || !summary) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Analítica</h2>
				<p className="mt-2 text-sm text-error">{error ?? "Error desconocido"}</p>
			</Card>
		);
	}

	const periodStart = new Date(summary.periodStart);
	const periodEnd = new Date(summary.periodEnd);
	const periodLabel = Number.isNaN(periodStart.getTime())
		? summary.periodStart
		: `${periodStart.toLocaleDateString("es-ES")} – ${periodEnd.toLocaleDateString("es-ES")}`;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center gap-3">
				<span className="text-sm text-muted">Periodo:</span>
				<Button
					type="button"
					variant={periodDays === 7 ? "primary" : "secondary"}
					onClick={() => setPeriodDays(7)}
				>
					Últimos 7 días
				</Button>
				<Button
					type="button"
					variant={periodDays === 30 ? "primary" : "secondary"}
					onClick={() => setPeriodDays(30)}
				>
					Últimos 30 días
				</Button>
			</div>

			<PlatformAnalyticsKpiGrid summary={summary} />

			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold text-foreground">Top negocios</h2>
				<PlatformAnalyticsTopTenantsTable
					title="Por escaneos QR"
					description="Staff scan registrados en el periodo"
					rows={summary.topTenantsByQrScans}
				/>
				<PlatformAnalyticsTopTenantsTable
					title="Por sellos emitidos"
					description="Transacciones stamp_added en el periodo"
					rows={summary.topTenantsByStamps}
				/>
				<PlatformAnalyticsTopTenantsTable
					title="Por premios canjeados"
					description="Transacciones reward_redeemed en el periodo"
					rows={summary.topTenantsByRewardsRedeemed}
				/>
			</section>

			<p className="text-xs text-muted">
				Ventana: {periodLabel} ({summary.timezone}). Actualizado:{" "}
				{new Date(summary.generatedAt).toLocaleString("es-ES")}.
			</p>
		</div>
	);
}
