"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import type { PlatformBillingOverviewResponse } from "../../../lib/platform/billing";
import { Card } from "../ui/Card";
import { PlatformBillingKpiGrid } from "./PlatformBillingKpiGrid";
import { PlatformBillingSubscriptionsTable } from "./PlatformBillingSubscriptionsTable";

export function PlatformBillingOverviewPanel(): ReactElement {
	const [overview, setOverview] = useState<PlatformBillingOverviewResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/billing/overview", {
				credentials: "include",
			});

			if (!response.ok) {
				setError("No se pudo cargar la vista de facturación");
				setOverview(null);

				return;
			}

			const data = (await response.json()) as PlatformBillingOverviewResponse;
			setOverview(data);
		} catch {
			setError("No se pudo conectar con el servidor");
			setOverview(null);
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
				<h2 className="font-medium text-foreground">Facturación</h2>
				<p className="mt-2 text-sm text-muted">Cargando MRR estimado y Suscripciones…</p>
			</Card>
		);
	}

	if (error || !overview) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Facturación</h2>
				<p className="mt-2 text-sm text-error">{error ?? "Error desconocido"}</p>
			</Card>
		);
	}

	const generatedAt = new Date(overview.generatedAt);
	const generatedLabel = Number.isNaN(generatedAt.getTime())
		? overview.generatedAt
		: generatedAt.toLocaleString("es-ES");

	return (
		<div className="flex flex-col gap-6">
			<PlatformBillingKpiGrid overview={overview} />
			<PlatformBillingSubscriptionsTable subscriptions={overview.subscriptions} />
			<p className="text-xs text-muted">
				MRR: {overview.mrrFormula}. Actualizado: {generatedLabel}.
			</p>
		</div>
	);
}
