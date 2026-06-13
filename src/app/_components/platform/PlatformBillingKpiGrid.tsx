"use client";

import type { ReactElement } from "react";

import type { PlatformBillingOverviewResponse } from "../../../lib/platform/billing";
import { Card } from "../ui/Card";

type PlatformBillingKpiGridProps = {
	overview: PlatformBillingOverviewResponse;
};

function formatEurosFromCents(cents: number): string {
	return new Intl.NumberFormat("es-ES", {
		style: "currency",
		currency: "EUR",
	}).format(cents / 100);
}

export function PlatformBillingKpiGrid({ overview }: PlatformBillingKpiGridProps): ReactElement {
	const items = [
		{
			label: "MRR estimado",
			value: formatEurosFromCents(overview.mrrCents),
			description: "Ingresos recurrentes mensuales (suscripciones activas)",
		},
		{
			label: "Suscripciones activas",
			value: String(overview.activeSubscriptions),
			description: "Filas Stripe en estado active",
		},
		{
			label: "Pagos pendientes",
			value: String(overview.pastDueCount),
			description: "Suscripciones past_due",
		},
		{
			label: "Suspendidos por billing",
			value: String(overview.billingSuspendedTenants),
			description: "Tenants suspendidos con sub past_due",
		},
	];

	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{items.map((item) => (
				<Card key={item.label}>
					<p className="text-sm text-muted">{item.label}</p>
					<p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
					<p className="mt-1 text-xs text-muted">{item.description}</p>
				</Card>
			))}
		</div>
	);
}
