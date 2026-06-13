"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import {
	type CustomerZoneInsightsResponse,
	formatCustomerZoneError,
} from "../../../../lib/loyalty/customerZone";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";

const INSIGHT_ITEMS: {
	key: keyof Pick<
		CustomerZoneInsightsResponse,
		"vipCount" | "atRiskCount" | "nearRewardCount" | "newThisMonthCount"
	>;
	label: string;
	description: string;
}[] = [
	{ key: "vipCount", label: "Clientes VIP", description: "Destacados este mes" },
	{ key: "atRiskCount", label: "En riesgo", description: "Sin visita reciente" },
	{ key: "nearRewardCount", label: "Cerca de premio", description: "A un sello del objetivo" },
	{ key: "newThisMonthCount", label: "Nuevos este mes", description: "Alta en el local" },
];

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

export function CustomerZoneInsights(): ReactElement {
	const [insights, setInsights] = useState<CustomerZoneInsightsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/loyalty/customers/insights", {
				credentials: "include",
			});
			const body = (await response.json()) as CustomerZoneInsightsResponse;

			if (!response.ok) {
				setInsights(null);
				setError(formatCustomerZoneError(body));

				return;
			}

			setInsights(body);
		} catch {
			setInsights(null);
			setError("Error de red al cargar los insights.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Insights</h2>
				<p className="mt-2 text-sm text-muted">Cargando resumen…</p>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Insights</h2>
				<p className="mt-2 text-sm text-error">{error}</p>
				<Button type="button" variant="secondary" className="mt-4" onClick={() => void load()}>
					Reintentar
				</Button>
			</Card>
		);
	}

	const formattedGeneratedAt = formatGeneratedAt(insights?.generatedAt);

	return (
		<section className="flex flex-col gap-3">
			<div>
				<h2 className="font-medium text-foreground">Insights</h2>
				<p className="mt-1 text-sm text-muted">¿Cómo va tu cafetería?</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{INSIGHT_ITEMS.map(({ key, label, description }) => (
					<Card key={key} className="p-4">
						<p className="text-xs text-muted">{label}</p>
						<p className="mt-1 text-2xl font-semibold text-foreground">{insights?.[key] ?? 0}</p>
						<p className="mt-1 text-xs text-muted">{description}</p>
					</Card>
				))}
			</div>

			{formattedGeneratedAt || insights?.timezone ? (
				<p className="text-xs text-muted">
					{formattedGeneratedAt ? `Datos actualizados ${formattedGeneratedAt}` : null}
					{formattedGeneratedAt && insights?.timezone ? " · " : null}
					{insights?.timezone ?? null}
				</p>
			) : null}
		</section>
	);
}
