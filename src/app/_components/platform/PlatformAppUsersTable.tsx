"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export type PlatformAppUserRow = {
	userId: string;
	name: string;
	email: string;
	qrValue: string | null;
	createdAt: string;
	establishmentsCount: number;
	lastTransactionAt: string | null;
};

type UsersResponse = {
	users: PlatformAppUserRow[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
	filter: AppUserFilter;
};

export type AppUserFilter = "all" | "new_7d" | "no_activity" | "with_establishments";

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

const FILTER_OPTIONS: { value: AppUserFilter; label: string }[] = [
	{ value: "all", label: "Todos" },
	{ value: "new_7d", label: "Nuevos (7 días)" },
	{ value: "with_establishments", label: "Con locales" },
	{ value: "no_activity", label: "Sin actividad" },
];

function formatDate(iso: string | null): string {
	if (!iso) {
		return "—";
	}

	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "—";
	}

	return date.toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function formatDateTime(iso: string | null): string {
	if (!iso) {
		return "—";
	}

	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "—";
	}

	return date.toLocaleString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function PlatformAppUsersTable(): ReactElement {
	const [users, setUsers] = useState<PlatformAppUserRow[] | null>(null);
	const [total, setTotal] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [offset, setOffset] = useState(0);
	const [filter, setFilter] = useState<AppUserFilter>("all");
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

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
				filter,
			});

			if (searchQuery) {
				params.set("q", searchQuery);
			}

			const response = await fetch(`/api/platform/users?${params.toString()}`, {
				credentials: "include",
			});

			if (!response.ok) {
				setError("No se pudo cargar la lista de clientes");
				setUsers(null);

				return;
			}

			const data = (await response.json()) as UsersResponse;
			setUsers(data.users ?? []);
			setTotal(data.total ?? 0);
			setHasMore(data.hasMore ?? false);
		} catch {
			setError("No se pudo conectar con el servidor");
			setUsers(null);
		} finally {
			setLoading(false);
		}
	}, [filter, offset, searchQuery]);

	useEffect(() => {
		void load();
	}, [load]);

	const canGoBack = offset > 0;
	const canGoForward = hasMore;
	const pageStart = total === 0 ? 0 : offset + 1;
	const pageEnd = Math.min(offset + (users?.length ?? 0), total);

	return (
		<Card className="overflow-hidden p-0">
			<div className="border-b border-border px-6 py-4">
				<h2 className="font-medium text-foreground">Clientes</h2>
				<p className="mt-1 text-sm text-muted">
					{total} {total === 1 ? "cliente" : "clientes"} de la app personal
				</p>
				<div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtros de clientes">
					{FILTER_OPTIONS.map((option) => {
						const active = filter === option.value;

						return (
							<Button
								key={option.value}
								type="button"
								variant={active ? "primary" : "secondary"}
								className="text-xs"
								aria-pressed={active}
								onClick={() => {
									setFilter(option.value);
									setOffset(0);
								}}
							>
								{option.label}
							</Button>
						);
					})}
				</div>
				<div className="mt-4">
					<label className="block text-sm font-medium text-muted" htmlFor="app-users-search">
						Buscar por nombre o email
					</label>
					<input
						id="app-users-search"
						type="search"
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
						placeholder="Nombre o email…"
						className="mt-1 w-full max-w-md rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
				</div>
			</div>

			{loading ? (
				<div className="overflow-x-auto">
					<table className="w-full min-w-[880px] text-left text-sm">
						<thead>
							<tr className="border-b border-border bg-background">
								<th className="px-6 py-3 font-medium text-muted">Nombre</th>
								<th className="px-6 py-3 font-medium text-muted">Email</th>
								<th className="px-6 py-3 font-medium text-muted">QR</th>
								<th className="px-6 py-3 font-medium text-muted">Locales</th>
								<th className="px-6 py-3 font-medium text-muted">Última transacción</th>
								<th className="px-6 py-3 font-medium text-muted">Alta</th>
								<th className="px-6 py-3 font-medium text-muted">Detalle</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td colSpan={7} className="px-6 py-4 text-sm text-muted">
									Cargando lista…
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			) : error ? (
				<p className="px-6 py-4 text-sm text-error">{error}</p>
			) : !users || users.length === 0 ? (
				<p className="px-6 py-4 text-sm text-muted">
					{searchQuery ? "Ningún cliente coincide con la búsqueda." : "No hay clientes registrados."}
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full min-w-[880px] text-left text-sm">
						<thead>
							<tr className="border-b border-border bg-background">
								<th className="px-6 py-3 font-medium text-muted">Nombre</th>
								<th className="px-6 py-3 font-medium text-muted">Email</th>
								<th className="px-6 py-3 font-medium text-muted">QR</th>
								<th className="px-6 py-3 font-medium text-muted">Locales</th>
								<th className="px-6 py-3 font-medium text-muted">Última transacción</th>
								<th className="px-6 py-3 font-medium text-muted">Alta</th>
								<th className="px-6 py-3 font-medium text-muted">Detalle</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr key={user.userId} className="border-b border-border last:border-b-0">
									<td className="px-6 py-3 font-medium text-foreground">{user.name}</td>
									<td className="px-6 py-3 text-muted">{user.email}</td>
									<td className="px-6 py-3 text-muted">
										{user.qrValue ? (
											<code className="text-xs">{user.qrValue.slice(0, 8)}…</code>
										) : (
											"—"
										)}
									</td>
									<td className="px-6 py-3 text-foreground">{user.establishmentsCount}</td>
									<td className="px-6 py-3 text-muted">
										{formatDateTime(user.lastTransactionAt)}
									</td>
									<td className="px-6 py-3 text-muted">{formatDate(user.createdAt)}</td>
									<td className="px-6 py-3">
										<Link
											href={`/platform/users/${user.userId}`}
											className="text-primary hover:opacity-80"
										>
											Ver
										</Link>
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
