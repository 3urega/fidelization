"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export type PlatformTenantRow = {
	id: string;
	name: string;
	slug: string;
	subscriptionPlan: string;
	status: string;
	createdAt: string;
};

type TenantsResponse = {
	tenants: PlatformTenantRow[];
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

function TenantStatusBadge({ status }: { status: string }): ReactElement {
	const isActive = status === "active";

	return (
		<span
			className={
				isActive
					? "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"
					: "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium text-error"
			}
		>
			{isActive ? "Activo" : "Suspendido"}
		</span>
	);
}

export function PlatformTenantsTable(): ReactElement {
	const [tenants, setTenants] = useState<PlatformTenantRow[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/tenants", { credentials: "include" });
			if (!response.ok) {
				setError("No se pudo cargar la lista de negocios");
				setTenants(null);

				return;
			}

			const data = (await response.json()) as TenantsResponse;
			setTenants(data.tenants ?? []);
		} catch {
			setError("No se pudo conectar con el servidor");
			setTenants(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	async function toggleStatus(tenant: PlatformTenantRow): Promise<void> {
		const nextStatus = tenant.status === "active" ? "suspended" : "active";
		setTogglingId(tenant.id);
		setActionError(null);

		try {
			const response = await fetch(`/api/platform/tenants/${tenant.id}/status`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: nextStatus }),
			});

			if (!response.ok) {
				const data = (await response.json()) as { error?: { description?: string } };
				setActionError(data.error?.description ?? `Error al actualizar (${response.status})`);

				return;
			}

			const data = (await response.json()) as { tenant: PlatformTenantRow };
			setTenants((current) =>
				(current ?? []).map((row) => (row.id === tenant.id ? { ...row, ...data.tenant } : row)),
			);
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setTogglingId(null);
		}
	}

	if (loading) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Negocios</h2>
				<p className="mt-2 text-sm text-muted">Cargando lista…</p>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Negocios</h2>
				<p className="mt-2 text-sm text-error">{error}</p>
			</Card>
		);
	}

	if (!tenants || tenants.length === 0) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Negocios</h2>
				<p className="mt-2 text-sm text-muted">No hay negocios registrados.</p>
			</Card>
		);
	}

	return (
		<Card className="overflow-hidden p-0">
			<div className="border-b border-border px-6 py-4">
				<h2 className="font-medium text-foreground">Negocios</h2>
				<p className="mt-1 text-sm text-muted">
					{tenants.length} {tenants.length === 1 ? "negocio" : "negocios"} en la plataforma
				</p>
				{actionError ? <p className="mt-2 text-sm text-error">{actionError}</p> : null}
			</div>

			<div className="overflow-x-auto">
				<table className="w-full min-w-[720px] text-left text-sm">
					<thead>
						<tr className="border-b border-border bg-background">
							<th className="px-6 py-3 font-medium text-muted">Nombre</th>
							<th className="px-6 py-3 font-medium text-muted">Slug</th>
							<th className="px-6 py-3 font-medium text-muted">Plan</th>
							<th className="px-6 py-3 font-medium text-muted">Estado</th>
							<th className="px-6 py-3 font-medium text-muted">Alta</th>
							<th className="px-6 py-3 font-medium text-muted">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{tenants.map((tenant) => {
							const isActive = tenant.status === "active";
							const busy = togglingId === tenant.id;

							return (
								<tr key={tenant.id} className="border-b border-border last:border-b-0">
									<td className="px-6 py-3 font-medium text-foreground">
										<Link
											href={`/platform/tenants/${tenant.id}`}
											className="text-primary hover:opacity-80"
										>
											{tenant.name}
										</Link>
									</td>
									<td className="px-6 py-3 text-muted">
										<code className="text-xs">{tenant.slug}</code>
									</td>
									<td className="px-6 py-3 text-foreground">{tenant.subscriptionPlan}</td>
									<td className="px-6 py-3">
										<TenantStatusBadge status={tenant.status} />
									</td>
									<td className="px-6 py-3 text-muted">{formatCreatedAt(tenant.createdAt)}</td>
									<td className="px-6 py-3">
										<Button
											type="button"
											variant="secondary"
											className="text-xs"
											disabled={busy || togglingId !== null}
											onClick={() => void toggleStatus(tenant)}
										>
											{busy ? "Guardando…" : isActive ? "Suspender" : "Activar"}
										</Button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
