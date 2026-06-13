"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import {
	type StampCampaignDashboardCampaign,
	type StampCampaignDashboardResponse,
} from "../../../lib/loyalty/stampCampaignDashboard";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type StampCampaignDashboardPanelProps = {
	isActive?: boolean;
};

const METRIC_LABELS: { key: keyof StampCampaignDashboardCampaign["scans"]; label: string }[] = [
	{ key: "today", label: "Hoy" },
	{ key: "yesterday", label: "Ayer" },
	{ key: "last7Days", label: "7 días" },
	{ key: "sinceStart", label: "Desde inicio" },
];

function formatGeneratedAt(iso: string | undefined): string | null {
	if (!iso) {
		return null;
	}

	const date = new Date(iso);

	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return date.toLocaleString("es-ES", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function StampCampaignDashboardCard({
	campaign,
}: {
	campaign: StampCampaignDashboardCampaign;
}): ReactElement {
	return (
		<Card>
			<h2 className="font-medium text-foreground">{campaign.name}</h2>
			<p className="mt-1 text-sm text-muted">
				{campaign.stampTypeLabel} · {campaign.requiredStamps} sellos
			</p>
			<dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
				{METRIC_LABELS.map(({ key, label }) => (
					<div key={key}>
						<dt className="text-xs text-muted">{label}</dt>
						<dd className="mt-0.5 text-lg font-semibold text-foreground">{campaign.scans[key]}</dd>
					</div>
				))}
			</dl>
		</Card>
	);
}

function ClientesPlaceholderCard(): ReactElement {
	return (
		<Card className="opacity-70">
			<h2 className="font-medium text-foreground">Clientes</h2>
			<p className="mt-1 text-sm text-muted">Próximamente</p>
		</Card>
	);
}

export function StampCampaignDashboardPanel({
	isActive = true,
}: StampCampaignDashboardPanelProps): ReactElement {
	const [campaigns, setCampaigns] = useState<StampCampaignDashboardCampaign[]>([]);
	const [generatedAt, setGeneratedAt] = useState<string | undefined>();
	const [timezone, setTimezone] = useState<string | undefined>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/loyalty/stamp-campaigns/dashboard", {
				credentials: "include",
			});
			const body = (await response.json()) as StampCampaignDashboardResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudieron cargar las métricas.");
				setCampaigns([]);

				return;
			}

			setCampaigns(body.campaigns ?? []);
			setGeneratedAt(body.generatedAt);
			setTimezone(body.timezone);
		} catch {
			setError("Error de red al cargar las métricas.");
			setCampaigns([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!isActive) {
			return;
		}

		void load();
	}, [isActive, load]);

	const formattedGeneratedAt = formatGeneratedAt(generatedAt);

	if (loading) {
		return (
			<div className="flex flex-col gap-6">
				<Card>
					<h2 className="font-medium text-foreground">Sellos</h2>
					<p className="mt-2 text-sm text-muted">Cargando métricas…</p>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col gap-6">
				<Card>
					<h2 className="font-medium text-foreground">Sellos</h2>
					<p className="mt-2 text-sm text-error">{error}</p>
					<Button type="button" variant="secondary" className="mt-4" onClick={() => void load()}>
						Reintentar
					</Button>
				</Card>
				<ClientesPlaceholderCard />
			</div>
		);
	}

	if (campaigns.length === 0) {
		return (
			<div className="flex flex-col gap-6">
				<Card>
					<h2 className="font-medium text-foreground">Sin campañas activas</h2>
					<p className="mt-1 text-sm text-muted">
						Crea una campaña de sellos para empezar a ver escaneos aquí.
					</p>
					<Link
						href="/settings/stamps"
						className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
					>
						Configurar sellos
					</Link>
				</Card>
				<ClientesPlaceholderCard />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{campaigns.map((campaign) => (
				<StampCampaignDashboardCard key={campaign.id} campaign={campaign} />
			))}

			{formattedGeneratedAt || timezone ? (
				<p className="text-xs text-muted">
					{formattedGeneratedAt ? `Datos actualizados ${formattedGeneratedAt}` : null}
					{formattedGeneratedAt && timezone ? " · " : null}
					{timezone ?? null}
				</p>
			) : null}

			<ClientesPlaceholderCard />
		</div>
	);
}
