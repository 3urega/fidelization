"use client";

import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

import { LoyaltyAppLinkCard } from "../../_components/loyalty/LoyaltyAppLinkCard";
import { isTenantBrandingCustomized } from "../../../lib/tenant/isTenantBrandingCustomized";
import { PageHeader } from "../../_components/shell/PageHeader";
import { useTenantSession } from "../../_components/shell/TenantSessionProvider";
import { Button } from "../../_components/ui/Button";
import { Card } from "../../_components/ui/Card";

type StampCampaignsResponse = {
	campaigns?: { isActive: boolean }[];
};

export function HomeDashboard(): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [stampsDone, setStampsDone] = useState(false);
	const [stampsLoading, setStampsLoading] = useState(true);

	useEffect(() => {
		if (!session || session.role !== "owner") {
			setStampsLoading(false);

			return;
		}

		let cancelled = false;

		async function loadStampCampaigns(): Promise<void> {
			try {
				const response = await fetch("/api/loyalty/stamp-campaigns", {
					credentials: "include",
				});
				const body = (await response.json()) as StampCampaignsResponse;

				if (cancelled) {
					return;
				}

				if (response.ok) {
					setStampsDone((body.campaigns ?? []).some((campaign) => campaign.isActive));
				}
			} catch {
				if (!cancelled) {
					setStampsDone(false);
				}
			} finally {
				if (!cancelled) {
					setStampsLoading(false);
				}
			}
		}

		void loadStampCampaigns();

		return () => {
			cancelled = true;
		};
	}, [session]);

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	const brandingDone = isTenantBrandingCustomized(session.tenant);
	const isOwner = session.role === "owner";
	const stampsComplete = isOwner ? stampsDone : false;

	const placeholders = [
		{ title: "Clientes", description: "Próximamente" },
		{ title: "Promociones", description: "Próximamente" },
	];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={`Hola, ${session.user.name}`}
				description={`Panel del negocio · ${session.tenant.name}`}
			/>

			<Card>
				<h2 className="font-medium text-foreground">Configuración inicial</h2>
				<p className="mt-1 text-sm text-muted">Completa estos pasos para dejar tu negocio listo.</p>
				<ul className="mt-4 flex flex-col gap-3">
					<li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2">
							<span
								className={[
									"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
									brandingDone
										? "bg-primary text-primary-foreground"
										: "border border-border text-muted",
								].join(" ")}
								aria-hidden
							>
								{brandingDone ? "✓" : "·"}
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">Completa tu branding</p>
								<p className="text-sm text-muted">
									{brandingDone
										? "Logo y colores personalizados."
										: "Añade logo y colores de tu negocio."}
								</p>
							</div>
						</div>
						{isOwner ? (
							<Link
								href="/settings/branding"
								className="text-sm font-medium text-primary hover:underline sm:shrink-0"
							>
								{brandingDone ? "Editar" : "Configurar"}
							</Link>
						) : (
							<span className="text-sm text-muted sm:shrink-0">
								{brandingDone ? "Completado" : "Pendiente (owner)"}
							</span>
						)}
					</li>
					<li className="flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2">
							<span
								className={[
									"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
									stampsComplete
										? "bg-primary text-primary-foreground"
										: "border border-border text-muted",
								].join(" ")}
								aria-hidden
							>
								{stampsComplete ? "✓" : "·"}
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">
									Configura tu tarjeta de sellos
								</p>
								<p className="text-sm text-muted">
									{stampsLoading && isOwner
										? "Comprobando campañas…"
										: stampsComplete
											? "Tienes al menos una campaña activa."
											: "Crea una campaña para que los clientes acumulen sellos."}
								</p>
							</div>
						</div>
						{isOwner ? (
							<Link
								href="/settings/stamps"
								className="text-sm font-medium text-primary hover:underline sm:shrink-0"
							>
								{stampsComplete ? "Editar" : "Configurar"}
							</Link>
						) : (
							<span className="text-sm text-muted sm:shrink-0">
								{stampsComplete ? "Completado" : "Pendiente (owner)"}
							</span>
						)}
					</li>
					<li className="flex flex-col gap-3 border-t border-border pt-3">
						<div className="flex items-start gap-2">
							<span
								className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted"
								aria-hidden
							>
								·
							</span>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-foreground">
									Comparte tu enlace de fidelización
								</p>
								<p className="text-sm text-muted">
									Tus clientes se registran y obtienen su tarjeta QR en este enlace.
								</p>
								<div className="mt-3">
									<LoyaltyAppLinkCard tenantSlug={session.tenant.slug} />
								</div>
							</div>
						</div>
						<Link
							href="/scan"
							className="self-start text-sm font-medium text-primary hover:underline sm:ml-7"
						>
							Registrar visita de un cliente →
						</Link>
					</li>
				</ul>
			</Card>

			<div className="grid gap-4 sm:grid-cols-2">
				{placeholders.map((item) => (
					<Card key={item.title} className="opacity-70">
						<h2 className="font-medium text-foreground">{item.title}</h2>
						<p className="mt-1 text-sm text-muted">{item.description}</p>
					</Card>
				))}
			</div>

			<Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
				Más funciones en la siguiente fase
			</Button>
		</div>
	);
}
