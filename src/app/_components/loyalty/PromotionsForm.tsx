"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { tenantHasFeature } from "../shell/planFeatures";
import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type PromotionType = "discount" | "bundle" | "seasonal";

type PromotionPayload = {
	id: string;
	title: string;
	description: string;
	type: PromotionType;
	startDate: string | null;
	endDate: string | null;
	isActive: boolean;
	maxUsesPerUser?: number | null;
};

type PromotionsResponse = {
	promotions?: PromotionPayload[];
	promotion?: PromotionPayload;
	error?: {
		description?: string;
	};
};

const PROMOTION_TYPE_OPTIONS: { value: PromotionType; label: string }[] = [
	{ value: "discount", label: "Descuento" },
	{ value: "bundle", label: "Pack / combo" },
	{ value: "seasonal", label: "Temporada" },
];

const SELECT_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60";

const TEXTAREA_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60 min-h-[5rem] resize-y";

function formatPromotionType(type: PromotionType): string {
	return PROMOTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
	if (!startDate && !endDate) {
		return null;
	}

	if (startDate && endDate) {
		return `${startDate} — ${endDate}`;
	}

	return startDate ?? endDate;
}

export function PromotionsForm(): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [promotions, setPromotions] = useState<PromotionPayload[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState<PromotionType>("discount");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [maxUsesPerUser, setMaxUsesPerUser] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

	const hasPromotionsFeature = session ? tenantHasFeature(session, "promotions") : false;

	const loadPromotions = useCallback(async (): Promise<void> => {
		setListLoading(true);

		try {
			const response = await fetch("/api/loyalty/promotions", {
				credentials: "include",
			});
			const body = (await response.json()) as PromotionsResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudieron cargar las promociones.");
				setPromotions([]);

				return;
			}

			setPromotions(body.promotions ?? []);
		} catch {
			setSubmitError("Error de red al cargar las promociones.");
			setPromotions([]);
		} finally {
			setListLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!session || session.role !== "owner" || !hasPromotionsFeature) {
			setListLoading(false);

			return;
		}

		void loadPromotions();
	}, [session, hasPromotionsFeature, loadPromotions]);

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (session.role !== "owner") {
		return (
			<Card>
				<p className="text-sm text-muted">
					Solo el propietario del negocio puede configurar promociones.
				</p>
			</Card>
		);
	}

	if (!hasPromotionsFeature) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Plan Pro requerido</h2>
				<p className="mt-2 text-sm text-muted">
					Las promociones están disponibles en los planes Pro y Premium. Actualiza tu plan para
					crear ofertas para tus clientes.
				</p>
				<Link
					href="/onboarding/plan"
					className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
				>
					Ver planes y actualizar →
				</Link>
			</Card>
		);
	}

	const titleValid = title.trim().length > 0;
	const descriptionValid = description.trim().length > 0;

	async function handleCreate(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setSubmitError(null);
		setSuccess(null);

		if (!titleValid || !descriptionValid) {
			setSubmitError("Revisa el título y la descripción.");

			return;
		}

		setSaving(true);

		try {
			const response = await fetch("/api/loyalty/promotions", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim(),
					type,
					...(startDate ? { startDate } : {}),
					...(endDate ? { endDate } : {}),
					...(maxUsesPerUser.trim()
						? { maxUsesPerUser: Number.parseInt(maxUsesPerUser.trim(), 10) }
						: {}),
				}),
			});

			const body = (await response.json()) as PromotionsResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo crear la promoción.");

				return;
			}

			if (body.promotion) {
				setSuccess(`Promoción creada: «${body.promotion.title}».`);
				setTitle("");
				setDescription("");
				setType("discount");
				setStartDate("");
				setEndDate("");
				setMaxUsesPerUser("");
				await loadPromotions();
			}
		} catch {
			setSubmitError("Error de red al crear la promoción.");
		} finally {
			setSaving(false);
		}
	}

	async function handleDeactivate(promotionId: string): Promise<void> {
		setSubmitError(null);
		setSuccess(null);
		setDeactivatingId(promotionId);

		try {
			const response = await fetch(`/api/loyalty/promotions/${promotionId}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: false }),
			});

			const body = (await response.json()) as PromotionsResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo desactivar la promoción.");

				return;
			}

			setSuccess("Promoción desactivada.");
			await loadPromotions();
		} catch {
			setSubmitError("Error de red al desactivar la promoción.");
		} finally {
			setDeactivatingId(null);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<h2 className="font-medium text-foreground">Tus promociones</h2>
				{listLoading ? (
					<p className="mt-3 text-sm text-muted">Cargando promociones…</p>
				) : promotions.length === 0 ? (
					<p className="mt-3 text-sm text-muted">
						Aún no tienes promociones. Crea la primera abajo.
					</p>
				) : (
					<ul className="mt-4 flex flex-col gap-3">
						{promotions.map((promotion) => {
							const dateRange = formatDateRange(promotion.startDate, promotion.endDate);

							return (
								<li
									key={promotion.id}
									className="flex flex-col gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium text-foreground">{promotion.title}</p>
										<p className="text-sm text-muted">{promotion.description}</p>
										<p className="mt-1 text-xs text-muted">
											{formatPromotionType(promotion.type)}
											{dateRange ? ` · ${dateRange}` : null}
											{promotion.maxUsesPerUser != null
												? ` · ${promotion.maxUsesPerUser} usos/cliente`
												: null}
										</p>
									</div>
									<div className="flex items-center gap-3">
										<span
											className={[
												"rounded-full px-2 py-0.5 text-xs font-medium",
												promotion.isActive
													? "bg-primary/10 text-primary"
													: "bg-muted text-muted-foreground",
											].join(" ")}
										>
											{promotion.isActive ? "Activa" : "Inactiva"}
										</span>
										{promotion.isActive ? (
											<Button
												type="button"
												variant="secondary"
												disabled={deactivatingId === promotion.id}
												onClick={() => void handleDeactivate(promotion.id)}
												className="shrink-0"
											>
												{deactivatingId === promotion.id ? "Desactivando…" : "Desactivar"}
											</Button>
										) : null}
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</Card>

			<Card>
				<h2 className="font-medium text-foreground">Nueva promoción</h2>
				<form className="mt-4 flex flex-col gap-5" onSubmit={(event) => void handleCreate(event)}>
					<Field label="Título">
						<Input
							type="text"
							name="title"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="2x1 en bebidas calientes"
							autoComplete="off"
							maxLength={120}
						/>
					</Field>

					<Field label="Descripción">
						<textarea
							name="description"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Válido de lunes a viernes antes de las 12:00."
							maxLength={500}
							className={TEXTAREA_CLASS}
						/>
					</Field>

					<Field label="Tipo">
						<select
							name="type"
							value={type}
							onChange={(event) => setType(event.target.value as PromotionType)}
							className={SELECT_CLASS}
						>
							{PROMOTION_TYPE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</Field>

					<div className="grid gap-5 sm:grid-cols-2">
						<Field label="Fecha inicio (opcional)">
							<Input
								type="date"
								name="startDate"
								value={startDate}
								onChange={(event) => setStartDate(event.target.value)}
							/>
						</Field>

						<Field label="Fecha fin (opcional)">
							<Input
								type="date"
								name="endDate"
								value={endDate}
								onChange={(event) => setEndDate(event.target.value)}
							/>
						</Field>
					</div>

					<Field label="Usos por cliente (opcional)">
						<Input
							type="number"
							name="maxUsesPerUser"
							min={1}
							step={1}
							value={maxUsesPerUser}
							onChange={(event) => setMaxUsesPerUser(event.target.value)}
							placeholder="Sin límite"
						/>
					</Field>

					{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
					{success ? <p className="text-sm text-foreground">{success}</p> : null}

					<Button
						type="submit"
						disabled={saving || !titleValid || !descriptionValid}
						className="w-full sm:w-auto"
					>
						{saving ? "Creando…" : "Crear promoción"}
					</Button>
				</form>
			</Card>
		</div>
	);
}
