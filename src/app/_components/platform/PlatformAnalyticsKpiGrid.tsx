"use client";

import type { ReactElement } from "react";

import type { PlatformAnalyticsSummaryResponse } from "../../../lib/platform/analytics";
import { Card } from "../ui/Card";

type PlatformAnalyticsKpiGridProps = {
	summary: PlatformAnalyticsSummaryResponse;
};

const SNAPSHOT_ITEMS = [
	{ key: "tenantsActive" as const, label: "Negocios activos" },
	{ key: "tenantsSuspended" as const, label: "Suspendidos" },
	{ key: "usersRegistered" as const, label: "Usuarios app" },
	{ key: "activePromotions" as const, label: "Promos activas" },
	{ key: "subscriptionsPastDue" as const, label: "Subs. past_due" },
] as const;

const PERIOD_ITEMS = [
	{ key: "qrScans" as const, label: "QR escaneados" },
	{ key: "stampsIssued" as const, label: "Sellos emitidos" },
	{ key: "rewardsRedeemed" as const, label: "Premios canjeados" },
	{ key: "activeCustomers" as const, label: "Clientes activos" },
] as const;

export function PlatformAnalyticsKpiGrid({ summary }: PlatformAnalyticsKpiGridProps): ReactElement {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-sm font-medium text-muted">Instantánea plataforma</h2>
				<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{SNAPSHOT_ITEMS.map((item) => (
						<Card key={item.key}>
							<p className="text-xs text-muted">{item.label}</p>
							<p className="mt-1 text-2xl font-semibold text-foreground">
								{summary.platformTotals[item.key]}
							</p>
						</Card>
					))}
				</div>
			</div>

			<div>
				<h2 className="text-sm font-medium text-muted">
					Actividad fidelización · últimos {summary.periodDays} días
				</h2>
				<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
					{PERIOD_ITEMS.map((item) => (
						<Card key={item.key}>
							<p className="text-xs text-muted">{item.label}</p>
							<p className="mt-1 text-2xl font-semibold text-foreground">
								{summary.platformTotals[item.key]}
							</p>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
