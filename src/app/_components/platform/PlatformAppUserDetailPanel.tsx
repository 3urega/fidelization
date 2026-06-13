"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import type { PlatformAppUserDetailResponse } from "../../../lib/platform/appUsers";
import { Card } from "../ui/Card";

type PlatformAppUserDetailPanelProps = {
	userId: string;
};

function formatDateTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return iso;
	}

	return date.toLocaleString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatTransactionType(type: string): string {
	return type.replaceAll("_", " ");
}

export function PlatformAppUserDetailPanel({
	userId,
}: PlatformAppUserDetailPanelProps): ReactElement {
	const [detail, setDetail] = useState<PlatformAppUserDetailResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/platform/users/${userId}`, { credentials: "include" });
			if (!response.ok) {
				setError("No se pudo cargar el detalle del cliente");
				setDetail(null);

				return;
			}

			const data = (await response.json()) as PlatformAppUserDetailResponse;
			setDetail(data);
		} catch {
			setError("No se pudo conectar con el servidor");
			setDetail(null);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading) {
		return <p className="text-sm text-muted">Cargando detalle…</p>;
	}

	if (error || !detail) {
		return <p className="text-sm text-error">{error ?? "Cliente no encontrado"}</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<Card className="p-6">
				<h2 className="font-medium text-foreground">{detail.name}</h2>
				<p className="mt-1 text-sm text-muted">{detail.email}</p>
				<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
					<div>
						<dt className="text-muted">Alta</dt>
						<dd className="text-foreground">{formatDateTime(detail.createdAt)}</dd>
					</div>
					<div>
						<dt className="text-muted">QR global</dt>
						<dd className="text-foreground">
							{detail.qrValue ? <code className="text-xs">{detail.qrValue}</code> : "—"}
						</dd>
					</div>
				</dl>
			</Card>

			<Card className="overflow-hidden p-0">
				<div className="border-b border-border px-6 py-4">
					<h3 className="font-medium text-foreground">Locales</h3>
					<p className="mt-1 text-sm text-muted">
						{detail.establishments.length}{" "}
						{detail.establishments.length === 1 ? "local" : "locales"} vinculados
					</p>
				</div>
				{detail.establishments.length === 0 ? (
					<p className="px-6 py-4 text-sm text-muted">Sin locales vinculados.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] text-left text-sm">
							<thead>
								<tr className="border-b border-border bg-background">
									<th className="px-6 py-3 font-medium text-muted">Local</th>
									<th className="px-6 py-3 font-medium text-muted">Puntos</th>
									<th className="px-6 py-3 font-medium text-muted">Visitas</th>
								</tr>
							</thead>
							<tbody>
								{detail.establishments.map((establishment) => (
									<tr
										key={establishment.customerId}
										className="border-b border-border last:border-b-0"
									>
										<td className="px-6 py-3">
											<Link
												href={`/platform/tenants/${establishment.tenantId}`}
												className="text-primary hover:opacity-80"
											>
												{establishment.tenantName}{" "}
												<code className="text-xs text-muted">({establishment.tenantSlug})</code>
											</Link>
										</td>
										<td className="px-6 py-3 text-foreground">
											{establishment.pointsBalance}
										</td>
										<td className="px-6 py-3 text-foreground">{establishment.visitsCount}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<Card className="overflow-hidden p-0">
				<div className="border-b border-border px-6 py-4">
					<h3 className="font-medium text-foreground">Transacciones recientes</h3>
					<p className="mt-1 text-sm text-muted">Últimas {detail.recentTransactions.length} operaciones</p>
				</div>
				{detail.recentTransactions.length === 0 ? (
					<p className="px-6 py-4 text-sm text-muted">Sin transacciones registradas.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] text-left text-sm">
							<thead>
								<tr className="border-b border-border bg-background">
									<th className="px-6 py-3 font-medium text-muted">Fecha</th>
									<th className="px-6 py-3 font-medium text-muted">Local</th>
									<th className="px-6 py-3 font-medium text-muted">Tipo</th>
									<th className="px-6 py-3 font-medium text-muted">Puntos</th>
								</tr>
							</thead>
							<tbody>
								{detail.recentTransactions.map((transaction) => (
									<tr
										key={transaction.transactionId}
										className="border-b border-border last:border-b-0"
									>
										<td className="px-6 py-3 text-muted">
											{formatDateTime(transaction.createdAt)}
										</td>
										<td className="px-6 py-3 text-foreground">{transaction.tenantName}</td>
										<td className="px-6 py-3 text-foreground">
											{formatTransactionType(transaction.type)}
										</td>
										<td className="px-6 py-3 text-foreground">
											{transaction.points ?? "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</div>
	);
}
