"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import type { PlatformBillingOverviewResponse } from "../../../lib/platform/billing";
import { Card } from "../ui/Card";

type PlatformBillingSubscriptionsTableProps = {
	subscriptions: PlatformBillingOverviewResponse["subscriptions"];
};

function formatDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return iso;
	}

	return date.toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function SubscriptionStatusBadge({ status }: { status: string }): ReactElement {
	const isActive = status === "active";

	return (
		<span
			className={
				isActive
					? "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"
					: "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium text-error"
			}
		>
			{isActive ? "Activa" : status === "past_due" ? "Pago pendiente" : status}
		</span>
	);
}

export function PlatformBillingSubscriptionsTable({
	subscriptions,
}: PlatformBillingSubscriptionsTableProps): ReactElement {
	if (subscriptions.length === 0) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Suscripciones</h2>
				<p className="mt-2 text-sm text-muted">No hay suscripciones activas ni con pago pendiente.</p>
			</Card>
		);
	}

	return (
		<Card className="overflow-hidden p-0">
			<div className="border-b border-border px-6 py-4">
				<h2 className="font-medium text-foreground">Suscripciones</h2>
				<p className="mt-1 text-sm text-muted">
					Activas y con pago pendiente (excluye canceladas)
				</p>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full min-w-[880px] text-left text-sm">
					<thead>
						<tr className="border-b border-border bg-background">
							<th className="px-6 py-3 font-medium text-muted">Negocio</th>
							<th className="px-6 py-3 font-medium text-muted">Plan</th>
							<th className="px-6 py-3 font-medium text-muted">Estado</th>
							<th className="px-6 py-3 font-medium text-muted">Periodo</th>
							<th className="px-6 py-3 font-medium text-muted">Stripe</th>
						</tr>
					</thead>
					<tbody>
						{subscriptions.map((row) => (
							<tr key={row.subscriptionId} className="border-b border-border last:border-b-0">
								<td className="px-6 py-3">
									<Link
										href={`/platform/tenants/${row.tenantId}`}
										className="font-medium text-primary hover:opacity-80"
									>
										{row.tenantName}
									</Link>
									<p className="mt-0.5 text-xs text-muted">
										<code>{row.tenantSlug}</code>
										{row.tenantStatus === "suspended" ? " · Suspendido" : null}
									</p>
								</td>
								<td className="px-6 py-3 text-foreground">{row.planName}</td>
								<td className="px-6 py-3">
									<SubscriptionStatusBadge status={row.status} />
								</td>
								<td className="px-6 py-3 text-muted">
									{formatDate(row.startedAt)}
									{" — "}
									{row.endsAt ? formatDate(row.endsAt) : "En curso"}
								</td>
								<td className="px-6 py-3">
									{row.stripeDashboardUrl ? (
										<a
											href={row.stripeDashboardUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-primary hover:opacity-80"
										>
											Ver en Stripe
										</a>
									) : (
										<span className="text-sm text-muted">—</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
