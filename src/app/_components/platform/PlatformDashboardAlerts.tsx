"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import type { PlatformDashboardResponse } from "../../../lib/platform/dashboard";
import { Card } from "../ui/Card";

type PlatformDashboardAlertsProps = {
	metrics: PlatformDashboardResponse;
};

export function PlatformDashboardAlerts({ metrics }: PlatformDashboardAlertsProps): ReactElement | null {
	const alerts: { message: string; href: string }[] = [];

	if (metrics.tenantsSuspended > 0) {
		alerts.push({
			message: `${metrics.tenantsSuspended} negocio(s) suspendido(s).`,
			href: "/platform/tenants",
		});
	}

	if (metrics.subscriptionsPastDue > 0) {
		alerts.push({
			message: `${metrics.subscriptionsPastDue} suscripción(es) con pago pendiente.`,
			href: "/platform/billing",
		});
	}

	if (alerts.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			{alerts.map((alert) => (
				<Card key={alert.message} className="border-error/30 bg-error/5">
					<p className="text-sm text-foreground">
						{alert.message}{" "}
						<Link href={alert.href} className="font-medium text-primary hover:opacity-80">
							{alert.href === "/platform/billing" ? "Ver facturación" : "Ver negocios"}
						</Link>
					</p>
				</Card>
			))}
		</div>
	);
}
