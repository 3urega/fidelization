"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import type { PlatformAnalyticsTenantRankResponse } from "../../../lib/platform/analytics";
import { Card } from "../ui/Card";

type PlatformAnalyticsTopTenantsTableProps = {
	title: string;
	description: string;
	rows: PlatformAnalyticsTenantRankResponse[];
};

export function PlatformAnalyticsTopTenantsTable({
	title,
	description,
	rows,
}: PlatformAnalyticsTopTenantsTableProps): ReactElement {
	const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0);

	return (
		<Card className="flex flex-col gap-4">
			<div>
				<h3 className="font-medium text-foreground">{title}</h3>
				<p className="mt-1 text-sm text-muted">{description}</p>
			</div>

			{rows.length === 0 ? (
				<p className="text-sm text-muted">Sin actividad en el periodo seleccionado.</p>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-muted">
								<th className="pb-2 pr-4 font-medium">Negocio</th>
								<th className="pb-2 pr-4 font-medium">Total</th>
								<th className="pb-2 font-medium">Top negocios</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => {
								const widthPercent = maxValue > 0 ? Math.round((row.value / maxValue) * 100) : 0;

								return (
									<tr key={row.tenantId} className="border-t border-border">
										<td className="py-3 pr-4 align-middle">
											<Link
												href={`/platform/tenants/${row.tenantId}`}
												className="font-medium text-primary hover:underline"
											>
												{row.tenantName}
											</Link>
											<p className="text-xs text-muted">{row.tenantSlug}</p>
										</td>
										<td className="py-3 pr-4 align-middle font-semibold text-foreground">
											{row.value}
										</td>
										<td className="py-3 align-middle">
											<div className="h-2 w-full min-w-[8rem] rounded-full bg-muted/30">
												<div
													className="h-2 rounded-full bg-primary"
													style={{ width: `${widthPercent}%` }}
												/>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</Card>
	);
}
