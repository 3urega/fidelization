"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import { LoyaltyAppLinkCard } from "../../_components/loyalty/LoyaltyAppLinkCard";
import { tenantHasFeature } from "../../_components/shell/planFeatures";
import { useTenantSession } from "../../_components/shell/TenantSessionProvider";
import { Button } from "../../_components/ui/Button";
import { Card } from "../../_components/ui/Card";
import { hasTenantAddress } from "../../../lib/tenant/hasTenantAddress";
import { hasTenantChosenPlan } from "../../../lib/tenant/hasTenantChosenPlan";
import { hasTenantDiscoveryTags } from "../../../lib/tenant/hasTenantDiscoveryTags";
import { isTenantBrandingCustomized } from "../../../lib/tenant/isTenantBrandingCustomized";
import { ownerPanelTabUrl } from "../../../lib/tenant/ownerPanelRoutes";

type StampCampaignsResponse = {
	campaigns?: { isActive: boolean }[];
};

type EmployeesResponse = {
	employees?: { id: string }[];
};

type PromotionsResponse = {
	promotions?: { isActive: boolean }[];
};

export function OwnerConfigurationPanel(): ReactElement {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { session, refresh } = useTenantSession();
	const [checkoutNotice, setCheckoutNotice] = useState(false);
	const [stampsDone, setStampsDone] = useState(false);
	const [stampsLoading, setStampsLoading] = useState(true);
	const [teamDone, setTeamDone] = useState(false);
	const [teamLoading, setTeamLoading] = useState(true);
	const [promotionsDone, setPromotionsDone] = useState(false);
	const [promotionsLoading, setPromotionsLoading] = useState(true);

	useEffect(() => {
		if (searchParams.get("checkout") !== "success") {
			return;
		}

		setCheckoutNotice(true);
		void refresh();
		router.replace(ownerPanelTabUrl("config"));
	}, [searchParams, refresh, router]);

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

	useEffect(() => {
		if (!session || session.role !== "owner") {
			setTeamLoading(false);

			return;
		}

		let cancelled = false;

		async function loadEmployees(): Promise<void> {
			try {
				const response = await fetch("/api/tenant/employees", {
					credentials: "include",
				});
				const body = (await response.json()) as EmployeesResponse;

				if (cancelled) {
					return;
				}

				if (response.ok) {
					setTeamDone((body.employees ?? []).length >= 1);
				}
			} catch {
				if (!cancelled) {
					setTeamDone(false);
				}
			} finally {
				if (!cancelled) {
					setTeamLoading(false);
				}
			}
		}

		void loadEmployees();

		return () => {
			cancelled = true;
		};
	}, [session]);

	useEffect(() => {
		if (!session || session.role !== "owner" || !tenantHasFeature(session, "promotions")) {
			setPromotionsLoading(false);

			return;
		}

		let cancelled = false;

		async function loadPromotions(): Promise<void> {
			try {
				const response = await fetch("/api/loyalty/promotions", {
					credentials: "include",
				});
				const body = (await response.json()) as PromotionsResponse;

				if (cancelled) {
					return;
				}

				if (response.ok) {
					setPromotionsDone((body.promotions ?? []).some((promotion) => promotion.isActive));
				}
			} catch {
				if (!cancelled) {
					setPromotionsDone(false);
				}
			} finally {
				if (!cancelled) {
					setPromotionsLoading(false);
				}
			}
		}

		void loadPromotions();

		return () => {
			cancelled = true;
		};
	}, [session]);

	if (!session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	const isOwner = session.role === "owner";
	const brandingDone = isTenantBrandingCustomized(session.tenant);
	const addressDone = isOwner ? hasTenantAddress(session.tenant) : false;
	const tagsDone = isOwner ? hasTenantDiscoveryTags(session.tenant) : false;
	const planDone = isOwner ? hasTenantChosenPlan(session.tenant) : false;
	const stampsComplete = isOwner ? stampsDone : false;
	const teamComplete = isOwner ? teamDone : false;
	const promotionsComplete = isOwner ? promotionsDone : false;
	const showPromotionsChecklist = isOwner && tenantHasFeature(session, "promotions");

	return (
		<div className="flex flex-col gap-6">
			{checkoutNotice ? (
				<Card className="border-border bg-muted/30">
					<p className="text-sm text-foreground">
						{planDone
							? `Tu plan ${session.tenant.subscriptionPlan} ya está activo.`
							: "Pago recibido. Estamos activando tu suscripción; puede tardar unos segundos."}
					</p>
				</Card>
			) : null}

			<Card>
				<h2 className="font-medium text-foreground">Configuración inicial</h2>
				<p className="mt-1 text-sm text-muted">Completa estos pasos para dejar tu negocio listo.</p>
				<ul className="mt-4 flex flex-col gap-3">
					<li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2">
							<span
								className={[
									"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
									planDone
										? "bg-primary text-primary-foreground"
										: "border border-border text-muted",
								].join(" ")}
								aria-hidden
							>
								{planDone ? "✓" : "·"}
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">Elige tu plan</p>
								<p className="text-sm text-muted">
									{planDone
										? `Plan ${session.tenant.subscriptionPlan} activo.`
										: "Selecciona Basic, Pro o Premium para tu negocio."}
								</p>
							</div>
						</div>
						{isOwner ? (
							<Link
								href="/onboarding/plan"
								className="text-sm font-medium text-primary hover:underline sm:shrink-0"
							>
								{planDone ? "Ver planes" : "Elegir plan"}
							</Link>
						) : (
							<span className="text-sm text-muted sm:shrink-0">
								{planDone ? "Completado" : "Pendiente (owner)"}
							</span>
						)}
					</li>
					<li className="flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
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
									addressDone
										? "bg-primary text-primary-foreground"
										: "border border-border text-muted",
								].join(" ")}
								aria-hidden
							>
								{addressDone ? "✓" : "·"}
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">Añade la dirección de tu negocio</p>
								<p className="text-sm text-muted">
									{addressDone
										? "Los clientes pueden ver dónde estás."
										: "Recomendado para que te encuentren en la app."}
								</p>
							</div>
						</div>
						{isOwner ? (
							<Link
								href="/settings/profile"
								className="text-sm font-medium text-primary hover:underline sm:shrink-0"
							>
								{addressDone ? "Editar" : "Añadir dirección"}
							</Link>
						) : (
							<span className="text-sm text-muted sm:shrink-0">
								{addressDone ? "Completado" : "Pendiente (owner)"}
							</span>
						)}
					</li>
					<li className="flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2">
							<span
								className={[
									"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
									tagsDone
										? "bg-primary text-primary-foreground"
										: "border border-border text-muted",
								].join(" ")}
								aria-hidden
							>
								{tagsDone ? "✓" : "·"}
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">Añade tags a tu local</p>
								<p className="text-sm text-muted">
									{tagsDone
										? "Tu local aparece categorizado en exploración."
										: "Ayuda a los clientes a descubrir qué ofreces."}
								</p>
							</div>
						</div>
						{isOwner ? (
							<Link
								href="/settings/profile"
								className="text-sm font-medium text-primary hover:underline sm:shrink-0"
							>
								{tagsDone ? "Editar" : "Añadir tags"}
							</Link>
						) : (
							<span className="text-sm text-muted sm:shrink-0">
								{tagsDone ? "Completado" : "Pendiente (owner)"}
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
					<li className="flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2">
							<span
								className={[
									"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
									teamComplete
										? "bg-primary text-primary-foreground"
										: "border border-border text-muted",
								].join(" ")}
								aria-hidden
							>
								{teamComplete ? "✓" : "·"}
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">Invita a tu empleado</p>
								<p className="text-sm text-muted">
									{teamLoading && isOwner
										? "Comprobando equipo…"
										: teamComplete
											? "Tienes al menos un empleado en el equipo."
											: "Añade un empleado para que escanee QR en el mostrador."}
								</p>
							</div>
						</div>
						{isOwner ? (
							<Link
								href="/settings/team"
								className="text-sm font-medium text-primary hover:underline sm:shrink-0"
							>
								{teamComplete ? "Ver equipo" : "Invitar"}
							</Link>
						) : (
							<span className="text-sm text-muted sm:shrink-0">
								{teamComplete ? "Completado" : "Pendiente (owner)"}
							</span>
						)}
					</li>
					{showPromotionsChecklist ? (
						<li className="flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-start gap-2">
								<span
									className={[
										"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
										promotionsComplete
											? "bg-primary text-primary-foreground"
											: "border border-border text-muted",
									].join(" ")}
									aria-hidden
								>
									{promotionsComplete ? "✓" : "·"}
								</span>
								<div>
									<p className="text-sm font-medium text-foreground">Crea tu primera promoción</p>
									<p className="text-sm text-muted">
										{promotionsLoading
											? "Comprobando promociones…"
											: promotionsComplete
												? "Tienes al menos una promoción activa."
												: "Publica una oferta para tus clientes fidelizados."}
									</p>
								</div>
							</div>
							<Link
								href="/settings/promotions"
								className="text-sm font-medium text-primary hover:underline sm:shrink-0"
							>
								{promotionsComplete ? "Editar" : "Configurar"}
							</Link>
						</li>
					) : null}
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

			<Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
				Más funciones en la siguiente fase
			</Button>
		</div>
	);
}
