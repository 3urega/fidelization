"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export type PlatformOwnerBusinessRow = {
	tenantId: string;
	slug: string;
	name: string;
	subscriptionPlan: string;
	status: string;
};

export type PlatformOwnerRow = {
	userId: string;
	name: string;
	email: string;
	businesses: PlatformOwnerBusinessRow[];
};

type OwnersResponse = {
	owners: PlatformOwnerRow[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
};

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

function OwnerStatusBadge({ businesses }: { businesses: PlatformOwnerBusinessRow[] }): ReactElement {
	const hasSuspended = businesses.some((business) => business.status !== "active");

	return (
		<span
			className={
				hasSuspended
					? "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium text-error"
					: "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"
			}
		>
			{hasSuspended ? "Suspendido" : "Activo"}
		</span>
	);
}

function formatPlanColumn(businesses: PlatformOwnerBusinessRow[]): string {
	if (businesses.length === 0) {
		return "—";
	}

	if (businesses.length === 1) {
		return businesses[0]?.subscriptionPlan ?? "—";
	}

	return "Varios";
}

export function PlatformOwnersTable(): ReactElement {
	const [owners, setOwners] = useState<PlatformOwnerRow[] | null>(null);
	const [total, setTotal] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [offset, setOffset] = useState(0);
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [enteringTenantId, setEnteringTenantId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setSearchQuery(searchInput.trim());
			setOffset(0);
		}, SEARCH_DEBOUNCE_MS);

		return () => window.clearTimeout(timer);
	}, [searchInput]);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams({
				offset: String(offset),
				limit: String(PAGE_LIMIT),
			});

			if (searchQuery) {
				params.set("q", searchQuery);
			}

			const response = await fetch(`/api/platform/owners?${params.toString()}`, {
				credentials: "include",
			});

			if (!response.ok) {
				setError("No se pudo cargar la lista de comerciantes");
				setOwners(null);

				return;
			}

			const data = (await response.json()) as OwnersResponse;
			setOwners(data.owners ?? []);
			setTotal(data.total ?? 0);
			setHasMore(data.hasMore ?? false);
		} catch {
			setError("No se pudo conectar con el servidor");
			setOwners(null);
		} finally {
			setLoading(false);
		}
	}, [offset, searchQuery]);

	useEffect(() => {
		void load();
	}, [load]);

	async function enterAsTenant(tenantId: string): Promise<void> {
		setEnteringTenantId(tenantId);
		setActionError(null);

		try {
			const response = await fetch(`/api/platform/tenants/${tenantId}/impersonate`, {
				method: "POST",
				credentials: "include",
			});
			const data = (await response.json()) as {
				redirectUrl?: string;
				error?: { description?: string };
			};

			if (!response.ok) {
				setActionError(data.error?.description ?? `Error al entrar (${response.status})`);

				return;
			}

			window.location.assign(data.redirectUrl ?? "/panel");
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setEnteringTenantId(null);
		}
	}

	const canGoBack = offset > 0;
	const canGoForward = hasMore;
	const pageStart = total === 0 ? 0 : offset + 1;
	const pageEnd = Math.min(offset + (owners?.length ?? 0), total);

	return (
		<Card className="overflow-hidden p-0">
			<div className="border-b border-border px-6 py-4">
				<h2 className="font-medium text-foreground">Comerciantes</h2>
				<p className="mt-1 text-sm text-muted">
					{total} {total === 1 ? "comerciante" : "comerciantes"} con rol propietario
				</p>
				<div className="mt-4">
					<label className="block text-sm font-medium text-muted" htmlFor="owners-search">
						Buscar por nombre o email
					</label>
					<input
						id="owners-search"
						type="search"
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
						placeholder="Nombre o email…"
						className="mt-1 w-full max-w-md rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
				</div>
				{actionError ? <p className="mt-2 text-sm text-error">{actionError}</p> : null}
			</div>

			{loading ? (
				<p className="px-6 py-4 text-sm text-muted">Cargando lista…</p>
			) : error ? (
				<p className="px-6 py-4 text-sm text-error">{error}</p>
			) : !owners || owners.length === 0 ? (
				<p className="px-6 py-4 text-sm text-muted">
					{searchQuery ? "Ningún comerciante coincide con la búsqueda." : "No hay comerciantes registrados."}
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-[880px] text-left text-sm">
						<thead>
							<tr className="border-b border-border bg-background">
								<th className="px-6 py-3 font-medium text-muted">Nombre</th>
								<th className="px-6 py-3 font-medium text-muted">Email</th>
								<th className="px-6 py-3 font-medium text-muted">Negocios</th>
								<th className="px-6 py-3 font-medium text-muted">Plan</th>
								<th className="px-6 py-3 font-medium text-muted">Estado</th>
								<th className="px-6 py-3 font-medium text-muted">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{owners.map((owner) => (
								<tr key={owner.userId} className="border-b border-border last:border-b-0">
									<td className="px-6 py-3 font-medium text-foreground">{owner.name}</td>
									<td className="px-6 py-3 text-muted">{owner.email}</td>
									<td className="px-6 py-3">
										<ul className="flex flex-col gap-1">
											{owner.businesses.map((business) => (
												<li key={business.tenantId}>
													<Link
														href={`/platform/tenants/${business.tenantId}`}
														className="text-primary hover:opacity-80"
													>
														<code className="text-xs">{business.slug}</code>
													</Link>
												</li>
											))}
										</ul>
									</td>
									<td className="px-6 py-3 text-foreground">{formatPlanColumn(owner.businesses)}</td>
									<td className="px-6 py-3">
										<OwnerStatusBadge businesses={owner.businesses} />
									</td>
									<td className="px-6 py-3">
										<div className="flex flex-wrap gap-2">
											{owner.businesses.map((business) => {
												const entering = enteringTenantId === business.tenantId;

												return (
													<Button
														key={business.tenantId}
														type="button"
														variant="secondary"
														className="text-xs"
														disabled={enteringTenantId !== null}
														onClick={() => void enterAsTenant(business.tenantId)}
													>
														{entering
															? "Entrando…"
															: owner.businesses.length > 1
																? `Entrar (${business.slug})`
																: "Entrar"}
													</Button>
												);
											})}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{!loading && !error && total > 0 ? (
				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
					<p className="text-sm text-muted">
						Mostrando {pageStart}–{pageEnd} de {total}
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="secondary"
							className="text-xs"
							disabled={!canGoBack || loading}
							onClick={() => setOffset((current) => Math.max(0, current - PAGE_LIMIT))}
						>
							Anterior
						</Button>
						<Button
							type="button"
							variant="secondary"
							className="text-xs"
							disabled={!canGoForward || loading}
							onClick={() => setOffset((current) => current + PAGE_LIMIT)}
						>
							Siguiente
						</Button>
					</div>
				</div>
			) : null}
		</Card>
	);
}
