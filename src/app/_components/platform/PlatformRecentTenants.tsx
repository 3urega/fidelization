"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import type { PlatformDashboardTenantSummary } from "../../../lib/platform/dashboard";
import { Card } from "../ui/Card";

type PlatformRecentTenantsProps = {
	tenants: PlatformDashboardTenantSummary[];
};

function formatCreatedAt(iso: string): string {
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

export function PlatformRecentTenants({ tenants }: PlatformRecentTenantsProps): ReactElement {
	return (
		<section aria-labelledby="recent-tenants-heading" className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2">
				<h2 id="recent-tenants-heading" className="text-sm font-medium text-foreground">
					Negocios recientes
				</h2>
				<Link href="/platform/tenants" className="text-sm font-medium text-primary hover:opacity-80">
					Ver todos
				</Link>
			</div>

			{tenants.length === 0 ? (
				<Card>
					<p className="text-sm text-muted">Todavía no hay negocios registrados.</p>
				</Card>
			) : (
				<ul className="flex flex-col gap-2">
					{tenants.map((tenant) => (
						<li key={tenant.id}>
							<Card>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="truncate font-medium text-foreground">{tenant.name}</p>
										<p className="text-xs text-muted">{tenant.slug}</p>
									</div>
									<div className="flex flex-col items-end gap-1 text-right">
										<span
											className={
												tenant.status === "active"
													? "text-xs font-medium text-foreground"
													: "text-xs font-medium text-error"
											}
										>
											{tenant.status === "active" ? "Activo" : "Suspendido"}
										</span>
										<span className="text-xs text-muted">{formatCreatedAt(tenant.createdAt)}</span>
									</div>
								</div>
							</Card>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
