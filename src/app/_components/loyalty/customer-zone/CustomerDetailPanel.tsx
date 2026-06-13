"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import {
	type CustomerZoneDetailResponse,
	formatActivityDate,
	formatCustomerSince,
	formatCustomerZoneError,
	formatRewardRedeemedDate,
} from "../../../../lib/loyalty/customerZone";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { CustomerZoneStatusBadge } from "./CustomerZoneStatusBadge";

const QUICK_ACTIONS = ["Regalar sello", "Regalar recompensa", "Añadir nota"] as const;

export function CustomerDetailPanel(): ReactElement {
	const params = useParams();
	const customerId = typeof params.id === "string" ? params.id : "";
	const [detail, setDetail] = useState<CustomerZoneDetailResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		if (!customerId) {
			setDetail(null);
			setNotFound(true);
			setError(null);
			setLoading(false);

			return;
		}

		setLoading(true);
		setNotFound(false);
		setError(null);

		try {
			const response = await fetch(`/api/loyalty/customers/${customerId}`, {
				credentials: "include",
			});
			const body = (await response.json()) as CustomerZoneDetailResponse;

			if (response.status === 404) {
				setDetail(null);
				setNotFound(true);

				return;
			}

			if (!response.ok) {
				setDetail(null);
				setError(formatCustomerZoneError(body));

				return;
			}

			setDetail(body);
		} catch {
			setDetail(null);
			setError("Error de red al cargar la ficha del cliente.");
		} finally {
			setLoading(false);
		}
	}, [customerId]);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading) {
		return (
			<Card className="p-4">
				<p className="text-sm text-muted">Cargando ficha del cliente…</p>
			</Card>
		);
	}

	if (notFound) {
		return (
			<Card className="p-4">
				<p className="text-sm text-muted">Cliente no encontrado.</p>
				<Link href="/customers" className="mt-4 inline-block text-sm text-primary hover:underline">
					← Volver a clientes
				</Link>
			</Card>
		);
	}

	if (error || !detail?.id) {
		return (
			<Card className="p-4">
				<p className="text-sm text-error">{error ?? "No se pudo cargar la ficha del cliente."}</p>
				<div className="mt-4 flex flex-wrap gap-3">
					<Button type="button" variant="secondary" onClick={() => void load()}>
						Reintentar
					</Button>
					<Link href="/customers" className="inline-flex items-center text-sm text-primary hover:underline">
						← Volver a clientes
					</Link>
				</div>
			</Card>
		);
	}

	const stampProgress = detail.stampProgress ?? [];
	const recentActivity = detail.recentActivity ?? [];
	const rewardsRedeemed = detail.rewardsRedeemed ?? [];

	return (
		<div className="flex flex-col gap-8">
			<Link href="/customers" className="text-sm text-primary hover:underline">
				← Volver a clientes
			</Link>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium text-foreground">Resumen</h2>
				<Card className="p-4">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<h3 className="text-lg font-medium text-foreground">{detail.name}</h3>
						{detail.status ? <CustomerZoneStatusBadge status={detail.status} /> : null}
					</div>
					<dl className="mt-4 flex flex-col gap-2 text-sm">
						<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
							<dt className="text-muted">Cliente desde</dt>
							<dd className="text-foreground">{formatCustomerSince(detail.customerSince)}</dd>
						</div>
						<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
							<dt className="text-muted">Total visitas</dt>
							<dd className="text-foreground">{detail.visitsCount ?? 0}</dd>
						</div>
						<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
							<dt className="text-muted">Puntos</dt>
							<dd className="text-foreground">{detail.pointsBalance ?? 0}</dd>
						</div>
					</dl>
				</Card>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium text-foreground">Actividad</h2>
				{recentActivity.length === 0 ? (
					<Card className="p-4">
						<p className="text-sm text-muted">Sin actividad reciente.</p>
					</Card>
				) : (
					<Card className="overflow-hidden p-0">
						<ul className="divide-y divide-border">
							{recentActivity.map((activity) => (
								<li
									key={`${activity.occurredAt}-${activity.label}`}
									className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
								>
									<span className="shrink-0 text-muted">{formatActivityDate(activity.occurredAt)}</span>
									<span className="text-foreground">{activity.label}</span>
								</li>
							))}
						</ul>
					</Card>
				)}
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium text-foreground">Programas activos</h2>
				{stampProgress.length === 0 ? (
					<Card className="p-4">
						<p className="text-sm text-muted">Sin campañas activas.</p>
					</Card>
				) : (
					<ul className="flex flex-col gap-3">
						{stampProgress.map((row) => (
							<li key={row.campaignId}>
								<Card className="p-4">
									<p className="font-medium text-foreground">{row.campaignName}</p>
									{row.stampTypeLabel ? (
										<p className="mt-1 text-xs text-muted">{row.stampTypeLabel}</p>
									) : null}
									<p className="mt-2 text-sm text-foreground">
										{row.completed ? "Completada" : `${row.current} / ${row.required}`}
									</p>
								</Card>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium text-foreground">Recompensas entregadas</h2>
				{rewardsRedeemed.length === 0 ? (
					<Card className="p-4">
						<p className="text-sm text-muted">Sin recompensas entregadas.</p>
					</Card>
				) : (
					<ul className="flex flex-col gap-3">
						{rewardsRedeemed.map((reward) => (
							<li key={`${reward.redeemedAt}-${reward.rewardName}`}>
								<Card className="p-4">
									<p className="font-medium text-foreground">{reward.rewardName}</p>
									<p className="mt-1 text-sm text-muted">
										{formatRewardRedeemedDate(reward.redeemedAt)}
									</p>
								</Card>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-medium text-foreground">Acciones rápidas</h2>
				<Card className="flex flex-col gap-3 p-4">
					{QUICK_ACTIONS.map((label) => (
						<Button key={label} type="button" variant="secondary" disabled className="w-full sm:w-auto">
							{label}
						</Button>
					))}
					<p className="text-xs text-muted">Próximamente</p>
				</Card>
			</section>
		</div>
	);
}
