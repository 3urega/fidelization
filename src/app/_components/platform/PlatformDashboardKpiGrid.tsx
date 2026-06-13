"use client";

import type { ReactElement } from "react";

import type { PlatformDashboardResponse } from "../../../lib/platform/dashboard";
import { Card } from "../ui/Card";

type PlatformDashboardKpiGridProps = {
	metrics: PlatformDashboardResponse;
};

const KPI_ITEMS: {
	key: keyof Pick<
		PlatformDashboardResponse,
		| "tenantsActive"
		| "tenantsSuspended"
		| "usersRegistered"
		| "qrScansToday"
		| "stampsToday"
		| "activePromotions"
	>;
	label: string;
	description: string;
}[] = [
	{
		key: "tenantsActive",
		label: "Negocios activos",
		description: "Tenants operativos en la plataforma",
	},
	{
		key: "tenantsSuspended",
		label: "Negocios suspendidos",
		description: "Requieren revisión",
	},
	{
		key: "usersRegistered",
		label: "Usuarios registrados",
		description: "Cuentas app personal (sin superadmin)",
	},
	{
		key: "qrScansToday",
		label: "Escaneos QR hoy",
		description: "Staff scan registrados hoy",
	},
	{
		key: "stampsToday",
		label: "Sellos emitidos hoy",
		description: "Sellos añadidos hoy",
	},
	{
		key: "activePromotions",
		label: "Promociones activas",
		description: "En todos los negocios",
	},
];

export function PlatformDashboardKpiGrid({ metrics }: PlatformDashboardKpiGridProps): ReactElement {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{KPI_ITEMS.map((item) => (
				<Card key={item.key}>
					<p className="text-xs text-muted">{item.label}</p>
					<p className="mt-1 text-2xl font-semibold text-foreground">{metrics[item.key]}</p>
					<p className="mt-1 text-xs text-muted">{item.description}</p>
				</Card>
			))}
		</div>
	);
}
