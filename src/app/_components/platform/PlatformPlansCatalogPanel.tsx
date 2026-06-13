"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type SubscriptionPlanFeatures = {
	stamps: boolean;
	points: boolean;
	promotions: boolean;
	coupons: boolean;
	push: boolean;
	gamification: boolean;
	referrals: boolean;
	analytics: boolean;
};

type PlatformPlanRow = {
	id: string;
	name: string;
	priceMonthly: number;
	priceYearly: number;
	features: SubscriptionPlanFeatures;
	limits: { employees?: number } | null;
	isActive: boolean;
};

type PlansResponse = {
	plans: PlatformPlanRow[];
};

type PlanDraft = {
	priceMonthlyEuros: string;
	priceYearlyEuros: string;
	features: SubscriptionPlanFeatures;
	employees: string;
	isActive: boolean;
};

const FEATURE_FIELDS: { key: keyof SubscriptionPlanFeatures; label: string }[] = [
	{ key: "stamps", label: "Sellos" },
	{ key: "points", label: "Puntos" },
	{ key: "promotions", label: "Promociones" },
	{ key: "coupons", label: "Cupones" },
	{ key: "push", label: "Push" },
	{ key: "gamification", label: "Gamificación" },
	{ key: "referrals", label: "Referidos" },
	{ key: "analytics", label: "Analítica" },
];

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

	return name.charAt(0).toUpperCase() + name.slice(1);
}

function centsToEurosInput(cents: number): string {
	return (cents / 100).toFixed(2);
}

function eurosInputToCents(value: string): number {
	const parsed = Number.parseFloat(value.replace(",", "."));

	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new Error("Precio inválido");
	}

	return Math.round(parsed * 100);
}

function planToDraft(plan: PlatformPlanRow): PlanDraft {
	return {
		priceMonthlyEuros: centsToEurosInput(plan.priceMonthly),
		priceYearlyEuros: centsToEurosInput(plan.priceYearly),
		features: { ...plan.features },
		employees: String(plan.limits?.employees ?? ""),
		isActive: plan.isActive,
	};
}

export function PlatformPlansCatalogPanel(): ReactElement {
	const [plans, setPlans] = useState<PlatformPlanRow[] | null>(null);
	const [drafts, setDrafts] = useState<Record<string, PlanDraft>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [savingId, setSavingId] = useState<string | null>(null);
	const [successId, setSuccessId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/plans", { credentials: "include" });
			if (!response.ok) {
				setError("No se pudo cargar el catálogo de planes");
				setPlans(null);

				return;
			}

			const data = (await response.json()) as PlansResponse;
			const rows = data.plans ?? [];
			setPlans(rows);
			setDrafts(Object.fromEntries(rows.map((plan) => [plan.id, planToDraft(plan)])));
		} catch {
			setError("No se pudo conectar con el servidor");
			setPlans(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	function updateDraft(planId: string, patch: Partial<PlanDraft>): void {
		setDrafts((current) => ({
			...current,
			[planId]: { ...current[planId], ...patch },
		}));
		setSuccessId(null);
	}

	function toggleFeature(planId: string, key: keyof SubscriptionPlanFeatures): void {
		const draft = drafts[planId];
		if (!draft) {
			return;
		}

		updateDraft(planId, {
			features: {
				...draft.features,
				[key]: !draft.features[key],
			},
		});
	}

	async function savePlan(plan: PlatformPlanRow): Promise<void> {
		const draft = drafts[plan.id];
		if (!draft) {
			return;
		}

		setSavingId(plan.id);
		setActionError(null);
		setSuccessId(null);

		try {
			const employees = Number.parseInt(draft.employees, 10);
			const limits =
				Number.isInteger(employees) && employees >= 1 ? { employees } : null;

			const response = await fetch(`/api/platform/plans/${plan.id}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					priceMonthly: eurosInputToCents(draft.priceMonthlyEuros),
					priceYearly: eurosInputToCents(draft.priceYearlyEuros),
					features: draft.features,
					limits,
					isActive: draft.isActive,
				}),
			});

			const data = (await response.json()) as {
				plan?: PlatformPlanRow;
				error?: { description?: string };
			};

			if (!response.ok || !data.plan) {
				setActionError(data.error?.description ?? `Error al guardar (${response.status})`);

				return;
			}

			setPlans((current) =>
				(current ?? []).map((row) => (row.id === plan.id ? data.plan! : row)),
			);
			setDrafts((current) => ({
				...current,
				[plan.id]: planToDraft(data.plan!),
			}));
			setSuccessId(plan.id);
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setSavingId(null);
		}
	}

	if (loading) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Catálogo de planes</h2>
				<p className="mt-2 text-sm text-muted">Cargando catálogo…</p>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Catálogo de planes</h2>
				<p className="mt-2 text-sm text-error">{error}</p>
			</Card>
		);
	}

	if (!plans || plans.length === 0) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Catálogo de planes</h2>
				<p className="mt-2 text-sm text-muted">No hay planes en el catálogo.</p>
			</Card>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{actionError ? <p className="text-sm text-error">{actionError}</p> : null}

			{plans.map((plan) => {
				const draft = drafts[plan.id];
				if (!draft) {
					return null;
				}

				const saving = savingId === plan.id;
				const saved = successId === plan.id;

				return (
					<Card key={plan.id} className="flex flex-col gap-4">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2 className="text-lg font-semibold text-foreground">
									{formatPlanTitle(plan.name)}
								</h2>
								<p className="mt-1 text-sm text-muted">
									Catálogo global · identificador <code className="text-xs">{plan.name}</code>
								</p>
							</div>
							<label className="flex items-center gap-2 text-sm text-foreground">
								<input
									type="checkbox"
									checked={draft.isActive}
									onChange={(event) =>
										updateDraft(plan.id, { isActive: event.target.checked })
									}
								/>
								Activo en catálogo
							</label>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block text-sm">
								<span className="font-medium text-muted">Precio mensual (€)</span>
								<input
									type="text"
									inputMode="decimal"
									value={draft.priceMonthlyEuros}
									onChange={(event) =>
										updateDraft(plan.id, { priceMonthlyEuros: event.target.value })
									}
									className="mt-1 w-full rounded-theme border border-border bg-background px-3 py-2 text-foreground"
								/>
							</label>
							<label className="block text-sm">
								<span className="font-medium text-muted">Precio anual (€)</span>
								<input
									type="text"
									inputMode="decimal"
									value={draft.priceYearlyEuros}
									onChange={(event) =>
										updateDraft(plan.id, { priceYearlyEuros: event.target.value })
									}
									className="mt-1 w-full rounded-theme border border-border bg-background px-3 py-2 text-foreground"
								/>
							</label>
						</div>

						<label className="block text-sm">
							<span className="font-medium text-muted">Límite de empleados</span>
							<input
								type="number"
								min={1}
								value={draft.employees}
								onChange={(event) => updateDraft(plan.id, { employees: event.target.value })}
								className="mt-1 w-full max-w-xs rounded-theme border border-border bg-background px-3 py-2 text-foreground"
							/>
						</label>

						<fieldset>
							<legend className="text-sm font-medium text-muted">Módulos incluidos</legend>
							<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
								{FEATURE_FIELDS.map(({ key, label }) => (
									<label key={key} className="flex items-center gap-2 text-sm text-foreground">
										<input
											type="checkbox"
											checked={draft.features[key]}
											onChange={() => toggleFeature(plan.id, key)}
										/>
										{label}
									</label>
								))}
							</div>
						</fieldset>

						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								disabled={saving || savingId !== null}
								onClick={() => void savePlan(plan)}
							>
								{saving ? "Guardando…" : "Guardar cambios"}
							</Button>
							{saved ? <span className="text-sm text-muted">Cambios guardados</span> : null}
						</div>
					</Card>
				);
			})}
		</div>
	);
}
