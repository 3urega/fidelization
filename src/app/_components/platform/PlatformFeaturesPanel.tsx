"use client";

import { useSearchParams } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";

import type { SubscriptionPlanFeatures } from "../../../contexts/billing/subscriptions/domain/SubscriptionPlanFeatures";
import type { TenantPlanFeature } from "../../../contexts/billing/subscriptions/domain/TenantPlanFeature";
import type { PlatformFeatureCatalogEntry } from "../../../lib/platform/featureCatalog";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { PlatformFeatureToggleGrid } from "./PlatformFeatureToggleGrid";

type PlanRow = {
	id: string;
	name: string;
	features: SubscriptionPlanFeatures;
};

type PlansResponse = {
	plans: PlanRow[];
	featureCatalog: PlatformFeatureCatalogEntry[];
	precedence: string;
};

type TenantFeaturesResponse = {
	tenantId: string;
	tenantSlug: string;
	tenantName: string;
	planName: string;
	planFeatures: SubscriptionPlanFeatures;
	overrides: Partial<Record<TenantPlanFeature, boolean>> | null;
	effectiveFeatures: SubscriptionPlanFeatures;
	featureCatalog: PlatformFeatureCatalogEntry[];
	precedence: string;
};

function formatPlanTitle(name: string): string {
	if (name === "basic") {
		return "Basic";
	}

	if (name === "pro") {
		return "Pro";
	}

	if (name === "premium") {
		return "Premium";
	}

	return name;
}

export function PlatformFeaturesPanel(): ReactElement {
	const searchParams = useSearchParams();
	const initialSlug = searchParams.get("tenant")?.trim() ?? "";

	const [catalog, setCatalog] = useState<PlatformFeatureCatalogEntry[]>([]);
	const [plans, setPlans] = useState<PlanRow[]>([]);
	const [planDrafts, setPlanDrafts] = useState<Record<string, SubscriptionPlanFeatures>>({});
	const [precedence, setPrecedence] = useState("");
	const [tenantSlugInput, setTenantSlugInput] = useState(initialSlug);
	const [tenantView, setTenantView] = useState<TenantFeaturesResponse | null>(null);
	const [tenantDraft, setTenantDraft] = useState<SubscriptionPlanFeatures | null>(null);
	const [loading, setLoading] = useState(true);
	const [tenantLoading, setTenantLoading] = useState(false);
	const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
	const [savingTenant, setSavingTenant] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const loadPlans = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/features/plans", { credentials: "include" });
			if (!response.ok) {
				setError("No se pudo cargar el catálogo de feature flags");
				setPlans([]);
				return;
			}

			const data = (await response.json()) as PlansResponse;
			setPlans(data.plans);
			setCatalog(data.featureCatalog);
			setPrecedence(data.precedence);
			setPlanDrafts(
				Object.fromEntries(data.plans.map((plan) => [plan.id, { ...plan.features }])),
			);
		} catch {
			setError("No se pudo conectar con el servidor");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadPlans();
	}, [loadPlans]);

	const loadTenantBySlug = useCallback(async (slug: string): Promise<void> => {
		const normalized = slug.trim().toLowerCase();
		if (!normalized) {
			setTenantView(null);
			setTenantDraft(null);
			return;
		}

		setTenantLoading(true);
		setActionError(null);

		try {
			const listResponse = await fetch("/api/platform/tenants", { credentials: "include" });
			if (!listResponse.ok) {
				setActionError("No se pudo listar negocios");
				return;
			}

			const listBody = (await listResponse.json()) as {
				tenants?: { id: string; slug: string }[];
			};
			const match = listBody.tenants?.find((row) => row.slug === normalized);
			if (!match) {
				setTenantView(null);
				setTenantDraft(null);
				setActionError(`No se encontró el negocio «${normalized}»`);
				return;
			}

			const response = await fetch(`/api/platform/features/tenants/${match.id}`, {
				credentials: "include",
			});
			if (!response.ok) {
				setActionError("No se pudo cargar el override del negocio");
				return;
			}

			const data = (await response.json()) as TenantFeaturesResponse;
			setTenantView(data);
			setTenantDraft({ ...data.effectiveFeatures });
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setTenantLoading(false);
		}
	}, []);

	useEffect(() => {
		if (initialSlug) {
			void loadTenantBySlug(initialSlug);
		}
	}, [initialSlug, loadTenantBySlug]);

	const inheritanceHints = useMemo(() => {
		if (!tenantView || !tenantDraft) {
			return undefined;
		}

		const hints: Partial<Record<TenantPlanFeature, "plan" | "override">> = {};
		for (const entry of catalog) {
			const key = entry.key;
			if (tenantView.overrides?.[key] !== undefined) {
				hints[key] = "override";
			} else {
				hints[key] = "plan";
			}
		}

		return hints;
	}, [catalog, tenantDraft, tenantView]);

	async function savePlan(plan: PlanRow): Promise<void> {
		const draft = planDrafts[plan.id];
		if (!draft) {
			return;
		}

		setSavingPlanId(plan.id);
		setActionError(null);

		try {
			const response = await fetch("/api/platform/features/plans", {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planId: plan.id, features: draft }),
			});

			if (!response.ok) {
				const body = (await response.json()) as { error?: { description?: string } };
				setActionError(body.error?.description ?? `Error al guardar (${response.status})`);
				return;
			}

			await loadPlans();
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setSavingPlanId(null);
		}
	}

	async function saveTenantOverrides(): Promise<void> {
		if (!tenantView || !tenantDraft) {
			return;
		}

		setSavingTenant(true);
		setActionError(null);

		const overrides: Partial<Record<TenantPlanFeature, boolean>> = {};
		for (const entry of catalog) {
			const key = entry.key;
			if (tenantDraft[key] !== tenantView.planFeatures[key]) {
				overrides[key] = tenantDraft[key];
			}
		}

		try {
			const response = await fetch(`/api/platform/features/tenants/${tenantView.tenantId}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					overrides: Object.keys(overrides).length > 0 ? overrides : null,
				}),
			});

			if (!response.ok) {
				const body = (await response.json()) as { error?: { description?: string } };
				setActionError(body.error?.description ?? `Error al guardar (${response.status})`);
				return;
			}

			const data = (await response.json()) as TenantFeaturesResponse;
			setTenantView(data);
			setTenantDraft({ ...data.effectiveFeatures });
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setSavingTenant(false);
		}
	}

	if (loading) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Feature flags</h2>
				<p className="mt-2 text-sm text-muted">Cargando catálogo Por plan y Por comercio…</p>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Feature flags</h2>
				<p className="mt-2 text-sm text-error">{error}</p>
			</Card>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{actionError ? <p className="text-sm text-error">{actionError}</p> : null}

			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold text-foreground">Por plan</h2>
				{plans.map((plan) => {
					const draft = planDrafts[plan.id];
					if (!draft) {
						return null;
					}

					return (
						<Card key={plan.id} className="flex flex-col gap-4">
							<div>
								<h3 className="font-medium text-foreground">{formatPlanTitle(plan.name)}</h3>
								<p className="mt-1 text-sm text-muted">
									Catálogo global · <code className="text-xs">{plan.name}</code>
								</p>
							</div>
							<PlatformFeatureToggleGrid
								catalog={catalog}
								values={draft}
								onChange={(key, enabled) =>
									setPlanDrafts((current) => ({
										...current,
										[plan.id]: { ...current[plan.id], [key]: enabled },
									}))
								}
							/>
							<Button
								type="button"
								disabled={savingPlanId !== null}
								onClick={() => void savePlan(plan)}
							>
								{savingPlanId === plan.id ? "Guardando…" : "Guardar plan"}
							</Button>
						</Card>
					);
				})}
			</section>

			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold text-foreground">Por comercio</h2>
				<Card className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
						<label className="block flex-1 text-sm">
							<span className="font-medium text-muted">Slug del negocio</span>
							<Input
								value={tenantSlugInput}
								onChange={(event) => setTenantSlugInput(event.target.value)}
								placeholder="cafe-demo"
								className="mt-1"
							/>
						</label>
						<Button
							type="button"
							disabled={tenantLoading}
							onClick={() => void loadTenantBySlug(tenantSlugInput)}
						>
							{tenantLoading ? "Cargando…" : "Cargar negocio"}
						</Button>
					</div>

					{tenantView && tenantDraft ? (
						<>
							<p className="text-sm text-muted">
								<strong className="text-foreground">{tenantView.tenantName}</strong> · plan{" "}
								{formatPlanTitle(tenantView.planName)}
							</p>
							<PlatformFeatureToggleGrid
								catalog={catalog}
								values={tenantDraft}
								inheritanceHints={inheritanceHints}
								onChange={(key, enabled) =>
									setTenantDraft((current) =>
										current ? { ...current, [key]: enabled } : current,
									)
								}
							/>
							<div className="flex flex-wrap gap-3">
								<Button type="button" disabled={savingTenant} onClick={() => void saveTenantOverrides()}>
									{savingTenant ? "Guardando…" : "Guardar override"}
								</Button>
								<Button
									type="button"
									variant="secondary"
									disabled={savingTenant}
									onClick={() => {
										setTenantDraft({ ...tenantView.planFeatures });
									}}
								>
									Revertir al plan
								</Button>
							</div>
						</>
					) : (
						<p className="text-sm text-muted">
							Busca un negocio por slug para definir overrides que ganan sobre su plan.
						</p>
					)}
				</Card>
			</section>

			{precedence ? <p className="text-xs text-muted">{precedence}</p> : null}
		</div>
	);
}
