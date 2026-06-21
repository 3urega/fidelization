"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import type { ModerationReportResponse } from "../../../lib/platform/moderation";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type ModerationStatus = "open" | "resolved";

type ReportsResponse = {
	reports?: ModerationReportResponse[];
	total?: number;
	error?: { description?: string };
};

const TARGET_TYPE_LABELS: Record<string, string> = {
	tenant: "Negocio",
	promotion: "Promoción",
};

function formatDate(value: string | null): string {
	if (!value) {
		return "—";
	}

	const date = new Date(value);

	return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-ES");
}

export function PlatformModerationPanel(): ReactElement {
	const [status, setStatus] = useState<ModerationStatus>("open");
	const [reports, setReports] = useState<ModerationReportResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [actingId, setActingId] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const load = useCallback(async (nextStatus: ModerationStatus): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/platform/moderation/reports?status=${nextStatus}`, {
				credentials: "include",
			});

			if (!response.ok) {
				setError("No se pudo cargar la cola de moderación");
				setReports([]);

				return;
			}

			const data = (await response.json()) as ReportsResponse;
			setReports(data.reports ?? []);
		} catch {
			setError("No se pudo conectar con el servidor");
			setReports([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load(status);
	}, [load, status]);

	async function handleResolve(reportId: string): Promise<void> {
		setActingId(reportId);
		setActionError(null);
		setSuccess(null);

		try {
			const response = await fetch(`/api/platform/moderation/reports/${reportId}/resolve`, {
				method: "PATCH",
				credentials: "include",
			});

			if (!response.ok) {
				const data = (await response.json()) as { error?: { description?: string } };
				setActionError(data.error?.description ?? "No se pudo resolver el reporte");

				return;
			}

			setSuccess("Reporte marcado como resuelto");
			window.dispatchEvent(new CustomEvent("platform-moderation-updated"));
			await load(status);
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setActingId(null);
		}
	}

	async function handleSuspend(reportId: string, tenantLabel: string): Promise<void> {
		const confirmed = window.confirm(
			`¿Suspender el negocio «${tenantLabel}»? Esta acción también marcará el reporte como resuelto.`,
		);

		if (!confirmed) {
			return;
		}

		setActingId(reportId);
		setActionError(null);
		setSuccess(null);

		try {
			const response = await fetch(
				`/api/platform/moderation/reports/${reportId}/suspend-tenant`,
				{
					method: "POST",
					credentials: "include",
				},
			);

			if (!response.ok) {
				const data = (await response.json()) as { error?: { description?: string } };
				setActionError(data.error?.description ?? "No se pudo suspender el negocio");

				return;
			}

			setSuccess("Negocio suspendido y reporte resuelto");
			window.dispatchEvent(new CustomEvent("platform-moderation-updated"));
			await load(status);
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setActingId(null);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap gap-3">
				<Button
					type="button"
					variant={status === "open" ? "primary" : "secondary"}
					onClick={() => setStatus("open")}
				>
					Abiertos
				</Button>
				<Button
					type="button"
					variant={status === "resolved" ? "primary" : "secondary"}
					onClick={() => setStatus("resolved")}
				>
					Resueltos
				</Button>
			</div>

			<Card>
				{loading ? (
					<p className="text-sm text-muted">Cargando cola…</p>
				) : error ? (
					<p className="text-sm text-error">{error}</p>
				) : reports.length === 0 ? (
					<p className="text-sm text-muted">
						{status === "open"
							? "No hay reportes pendientes."
							: "No hay reportes resueltos todavía."}
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="px-2 py-2 font-medium">Fecha</th>
									<th className="px-2 py-2 font-medium">Tipo</th>
									<th className="px-2 py-2 font-medium">Objetivo</th>
									<th className="px-2 py-2 font-medium">Motivo</th>
									<th className="px-2 py-2 font-medium">Reporter</th>
									{status === "open" ? (
										<th className="px-2 py-2 font-medium">Acciones</th>
									) : null}
								</tr>
							</thead>
							<tbody>
								{reports.map((report) => (
									<tr key={report.id} className="border-b border-border/60 align-top">
										<td className="px-2 py-2 text-foreground">{formatDate(report.createdAt)}</td>
										<td className="px-2 py-2 text-foreground">
											{TARGET_TYPE_LABELS[report.targetType] ?? report.targetType}
										</td>
										<td className="px-2 py-2 text-foreground">
											{report.tenantId ? (
												<Link
													href={`/platform/tenants/${report.tenantId}`}
													className="text-primary underline-offset-2 hover:underline"
												>
													{report.targetLabel}
												</Link>
											) : (
												report.targetLabel
											)}
										</td>
										<td className="px-2 py-2 text-foreground">{report.reason}</td>
										<td className="px-2 py-2 text-foreground">
											{report.reporter.name}
											<span className="block text-xs text-muted">{report.reporter.email}</span>
										</td>
										{status === "open" ? (
											<td className="px-2 py-2">
												<div className="flex flex-wrap gap-2">
													<Button
														type="button"
														variant="secondary"
														disabled={actingId === report.id}
														onClick={() => void handleResolve(report.id)}
													>
														Marcar resuelto
													</Button>
													{report.tenantId ? (
														<Button
															type="button"
															variant="primary"
															disabled={actingId === report.id}
															onClick={() =>
																void handleSuspend(report.id, report.targetLabel)
															}
														>
															Suspender negocio
														</Button>
													) : null}
												</div>
											</td>
										) : null}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{actionError ? <p className="mt-4 text-sm text-error">{actionError}</p> : null}
				{success ? <p className="mt-4 text-sm text-primary">{success}</p> : null}
			</Card>
		</div>
	);
}
