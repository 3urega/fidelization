"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import type { PlatformDashboardResponse } from "../../../lib/platform/dashboard";
import { usePlatformSession } from "../../_components/platform/PlatformSessionProvider";
import { PlatformDashboardAlerts } from "../../_components/platform/PlatformDashboardAlerts";
import { PlatformDashboardKpiGrid } from "../../_components/platform/PlatformDashboardKpiGrid";
import { PlatformRecentTenants } from "../../_components/platform/PlatformRecentTenants";
import { PageHeader } from "../../_components/shell/PageHeader";

function formatGeneratedAt(iso: string | undefined): string | null {
	if (!iso) {
		return null;
	}

	const date = new Date(iso);

	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return date.toLocaleString("es-ES", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function PlatformDashboard(): ReactElement {
	const { session, loading: sessionLoading, error: sessionError } = usePlatformSession();
	const [metrics, setMetrics] = useState<PlatformDashboardResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/dashboard", { credentials: "include" });
			if (!response.ok) {
				setError("No se pudo cargar el resumen de plataforma");
				setMetrics(null);

				return;
			}

			const data = (await response.json()) as PlatformDashboardResponse;
			setMetrics(data);
		} catch {
			setError("No se pudo conectar con el servidor");
			setMetrics(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	if (sessionError) {
		return <p className="text-sm text-error">{sessionError}</p>;
	}

	if (sessionLoading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={`Hola, ${session.user.name}`}
				description={`Resumen de plataforma · ${session.user.email}`}
			/>

			{loading ? <p className="text-sm text-muted">Cargando métricas…</p> : null}
			{error ? <p className="text-sm text-error">{error}</p> : null}

			{metrics ? (
				<>
					<PlatformDashboardKpiGrid metrics={metrics} />
					<PlatformDashboardAlerts metrics={metrics} />
					<PlatformRecentTenants tenants={metrics.recentTenants} />
					{formatGeneratedAt(metrics.generatedAt) ? (
						<p className="text-xs text-muted">
							Actualizado {formatGeneratedAt(metrics.generatedAt)} · zona horaria{" "}
							{metrics.timezone}
						</p>
					) : null}
				</>
			) : null}
		</div>
	);
}
