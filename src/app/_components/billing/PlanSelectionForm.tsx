"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { formatPlanPriceMonthly } from "../../../lib/billing/formatPlanPrice";
import { hasTenantChosenPlan } from "../../../lib/tenant/hasTenantChosenPlan";
import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type PlanFeatures = {
	stamps: boolean;
	points: boolean;
	promotions: boolean;
	coupons: boolean;
	push: boolean;
	gamification: boolean;
	referrals: boolean;
	analytics: boolean;
};

type PlanPayload = {
	id: string;
	name: string;
	priceMonthly: number;
	features: PlanFeatures;
	limits: { employees?: number } | null;
};

type PlansResponse = {
	plans?: PlanPayload[];
	error?: { description?: string };
};

const PLAN_LABELS: Record<string, string> = {
	basic: "Basic",
	pro: "Pro",
	premium: "Premium",
};

const FEATURE_LABELS: { key: keyof PlanFeatures; label: string }[] = [
	{ key: "stamps", label: "Tarjeta de sellos" },
	{ key: "points", label: "Puntos de fidelización" },
	{ key: "promotions", label: "Promociones" },
	{ key: "coupons", label: "Cupones" },
	{ key: "push", label: "Notificaciones push" },
	{ key: "analytics", label: "Analítica básica" },
	{ key: "gamification", label: "Gamificación" },
	{ key: "referrals", label: "Referidos" },
];

function planDisplayName(name: string): string {
	return PLAN_LABELS[name] ?? name;
}

function summarizeFeatures(features: PlanFeatures): string[] {
	return FEATURE_LABELS.filter(({ key }) => features[key]).map(({ label }) => label);
}

export function PlanSelectionForm(): ReactElement {
	const router = useRouter();
	const { session, loading, error, refresh } = useTenantSession();
	const [plans, setPlans] = useState<PlanPayload[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const loadPlans = useCallback(async (): Promise<void> => {
		setListLoading(true);

		try {
			const response = await fetch("/api/billing/plans", { credentials: "include" });
			const body = (await response.json()) as PlansResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudieron cargar los planes.");
				setPlans([]);

				return;
			}

			setPlans(body.plans ?? []);
		} catch {
			setSubmitError("Error de red al cargar los planes.");
			setPlans([]);
		} finally {
			setListLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!session || session.role !== "owner") {
			return;
		}

		if (hasTenantChosenPlan(session.tenant)) {
			router.replace("/home");

			return;
		}

		void loadPlans();
	}, [session, loadPlans, router]);

	async function assignPlan(planId: string): Promise<void> {
		setSubmitError(null);
		setSaving(true);
		setSelectedPlanId(planId);

		try {
			const response = await fetch("/api/billing/tenant-plan", {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planId }),
			});
			const body = (await response.json()) as { error?: { description?: string } };

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo asignar el plan.");
				setSaving(false);
				setSelectedPlanId(null);

				return;
			}

			await refresh();
			router.push("/home");
		} catch {
			setSubmitError("Error de red al asignar el plan.");
			setSaving(false);
			setSelectedPlanId(null);
		}
	}

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (session.role !== "owner") {
		return (
			<Card>
				<p className="text-sm text-muted">Solo el propietario del negocio puede elegir el plan.</p>
			</Card>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<p className="text-sm text-muted">
				Elige el plan que mejor encaje con tu negocio. Puedes empezar gratis y cambiar más adelante
				(sin pago en esta fase).
			</p>

			{listLoading ? <p className="text-sm text-muted">Cargando planes…</p> : null}

			{!listLoading && plans.length === 0 ? (
				<p className="text-sm text-muted">No hay planes disponibles en este momento.</p>
			) : null}

			<div className="grid gap-4 md:grid-cols-3">
				{plans.map((plan) => {
					const features = summarizeFeatures(plan.features);
					const isSelected = selectedPlanId === plan.id;

					return (
						<Card key={plan.id} className="flex flex-col gap-3">
							<div>
								<h3 className="text-lg font-semibold capitalize text-foreground">
									{planDisplayName(plan.name)}
								</h3>
								<p className="mt-1 text-2xl font-bold text-foreground">
									{formatPlanPriceMonthly(plan.priceMonthly)}
								</p>
								{plan.limits?.employees ? (
									<p className="mt-1 text-xs text-muted">
										Hasta {plan.limits.employees} empleados
									</p>
								) : null}
							</div>

							<ul className="flex flex-1 flex-col gap-1 text-sm text-muted">
								{features.map((feature) => (
									<li key={feature}>✓ {feature}</li>
								))}
							</ul>

							<Button
								type="button"
								className="w-full"
								disabled={saving}
								onClick={() => void assignPlan(plan.id)}
							>
								{saving && isSelected ? "Asignando…" : "Elegir plan"}
							</Button>
						</Card>
					);
				})}
			</div>

			{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
		</div>
	);
}
