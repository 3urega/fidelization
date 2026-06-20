"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";

import {
	MAX_ROULETTE_SEGMENTS,
	MIN_ROULETTE_SEGMENTS,
	type RouletteConfigPrimitives,
	type RouletteRules,
} from "../../../contexts/loyalty/games/domain/RouletteConfig";
import type { RoulettePrizeType } from "../../../contexts/loyalty/games/domain/RoulettePrizeType";
import type { RouletteSegmentPrimitives } from "../../../contexts/loyalty/games/domain/RouletteSegment";
import { DEFAULT_ROULETTE_CONFIG } from "../../../lib/roulette/rouletteEditorUtils";
import type { RouletteConfigResponse } from "../../../lib/loyalty/rouletteConfigJson";
import { tenantHasFeature } from "../shell/planFeatures";
import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { RouletteWheelPreview } from "./RouletteWheelPreview";

type CampaignOption = { id: string; name: string; isActive: boolean };
type PromotionOption = { id: string; title: string; isActive: boolean };
type RewardOption = { id: string; name: string; isActive: boolean };

const SELECT_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60";

const PRIZE_TYPE_OPTIONS: { value: RoulettePrizeType; label: string }[] = [
	{ value: "none", label: "Sin premio" },
	{ value: "points", label: "Puntos" },
	{ value: "stamp", label: "Sello (campaña)" },
	{ value: "promotion", label: "Promoción" },
	{ value: "physical", label: "Premio físico" },
];

function cloneConfig(config: RouletteConfigPrimitives): RouletteConfigPrimitives {
	return {
		version: config.version,
		rules: { ...config.rules },
		segments: config.segments.map((segment) => ({
			...segment,
			prize: { ...segment.prize },
		})),
	};
}

function mergeStockUsed(
	next: RouletteConfigPrimitives,
	previous: RouletteConfigPrimitives | null,
): RouletteConfigPrimitives {
	if (!previous) {
		return next;
	}

	const stockById = new Map(
		previous.segments.map((segment) => [segment.id, segment.stockUsed]),
	);

	return {
		...next,
		segments: next.segments.map((segment) => ({
			...segment,
			stockUsed: stockById.get(segment.id) ?? segment.stockUsed ?? 0,
		})),
	};
}

function newSegment(index: number): RouletteSegmentPrimitives {
	return {
		id: crypto.randomUUID(),
		label: `Segmento ${index + 1}`,
		weight: 10,
		prizeType: "none",
		prize: {},
		stockLimit: null,
		stockUsed: 0,
	};
}

export function RouletteConfigEditor(): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [isEnabled, setIsEnabled] = useState(false);
	const [config, setConfig] = useState<RouletteConfigPrimitives>(() =>
		cloneConfig(DEFAULT_ROULETTE_CONFIG),
	);
	const [savedConfig, setSavedConfig] = useState<RouletteConfigPrimitives | null>(null);
	const [pageLoading, setPageLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [toggling, setToggling] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
	const [promotions, setPromotions] = useState<PromotionOption[]>([]);
	const [rewards, setRewards] = useState<RewardOption[]>([]);

	const hasGamificationFeature = session ? tenantHasFeature(session, "gamification") : false;

	const activeCampaigns = useMemo(
		() => campaigns.filter((campaign) => campaign.isActive),
		[campaigns],
	);
	const activePromotions = useMemo(
		() => promotions.filter((promotion) => promotion.isActive),
		[promotions],
	);
	const activeRewards = useMemo(
		() => rewards.filter((reward) => reward.isActive),
		[rewards],
	);

	const loadConfig = useCallback(async (): Promise<void> => {
		const response = await fetch("/api/loyalty/games/ruleta/config", {
			credentials: "include",
		});
		const body = (await response.json()) as RouletteConfigResponse & {
			error?: { description?: string };
		};

		if (!response.ok) {
			throw new Error(body.error?.description ?? "No se pudo cargar la configuración.");
		}

		setIsEnabled(body.isEnabled);

		if (body.config) {
			const loaded = cloneConfig(body.config);
			setConfig(loaded);
			setSavedConfig(cloneConfig(body.config));
		} else {
			setConfig(cloneConfig(DEFAULT_ROULETTE_CONFIG));
			setSavedConfig(null);
		}
	}, []);

	const loadSelectors = useCallback(async (): Promise<void> => {
		const [campaignsRes, promotionsRes, rewardsRes] = await Promise.all([
			fetch("/api/loyalty/stamp-campaigns", { credentials: "include" }),
			fetch("/api/loyalty/promotions", { credentials: "include" }),
			fetch("/api/loyalty/rewards", { credentials: "include" }),
		]);

		if (campaignsRes.ok) {
			const body = (await campaignsRes.json()) as { campaigns?: CampaignOption[] };
			setCampaigns(body.campaigns ?? []);
		}

		if (promotionsRes.ok) {
			const body = (await promotionsRes.json()) as { promotions?: PromotionOption[] };
			setPromotions(body.promotions ?? []);
		}

		if (rewardsRes.ok) {
			const body = (await rewardsRes.json()) as { rewards?: RewardOption[] };
			setRewards(body.rewards ?? []);
		}
	}, []);

	useEffect(() => {
		if (!session || session.role !== "owner" || !hasGamificationFeature) {
			setPageLoading(false);

			return;
		}

		void (async () => {
			setPageLoading(true);
			setSubmitError(null);

			try {
				await Promise.all([loadConfig(), loadSelectors()]);
			} catch (loadError) {
				setSubmitError(
					loadError instanceof Error ? loadError.message : "Error al cargar la ruleta.",
				);
			} finally {
				setPageLoading(false);
			}
		})();
	}, [session, hasGamificationFeature, loadConfig, loadSelectors]);

	const updateSegment = (index: number, patch: Partial<RouletteSegmentPrimitives>): void => {
		setConfig((current) => {
			const segments = [...current.segments];
			const existing = segments[index];

			if (!existing) {
				return current;
			}

			segments[index] = {
				...existing,
				...patch,
				prize: patch.prize ?? existing.prize,
			};

			return { ...current, segments };
		});
	};

	const updateRules = (patch: Partial<RouletteRules>): void => {
		setConfig((current) => ({
			...current,
			rules: { ...current.rules, ...patch },
		}));
	};

	const addSegment = (): void => {
		setConfig((current) => {
			if (current.segments.length >= MAX_ROULETTE_SEGMENTS) {
				return current;
			}

			return {
				...current,
				segments: [...current.segments, newSegment(current.segments.length)],
			};
		});
	};

	const removeSegment = (index: number): void => {
		setConfig((current) => {
			if (current.segments.length <= MIN_ROULETTE_SEGMENTS) {
				return current;
			}

			return {
				...current,
				segments: current.segments.filter((_, segmentIndex) => segmentIndex !== index),
			};
		});
	};

	const handleToggleEnabled = async (): Promise<void> => {
		setToggling(true);
		setSubmitError(null);
		setSuccess(null);

		const nextEnabled = !isEnabled;

		try {
			const response = await fetch("/api/loyalty/games/ruleta/activation", {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isEnabled: nextEnabled }),
			});
			const body = (await response.json()) as RouletteConfigResponse & {
				error?: { description?: string };
			};

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo cambiar el estado.");
				return;
			}

			setIsEnabled(body.isEnabled);

			if (body.config) {
				setConfig(cloneConfig(body.config));
				setSavedConfig(cloneConfig(body.config));
			}

			setSuccess(body.isEnabled ? "Ruleta activada." : "Ruleta desactivada.");
		} catch {
			setSubmitError("Error de red al cambiar el estado.");
		} finally {
			setToggling(false);
		}
	};

	const handleSave = async (): Promise<void> => {
		setSaving(true);
		setSubmitError(null);
		setSuccess(null);

		const payload = mergeStockUsed(config, savedConfig);

		try {
			const response = await fetch("/api/loyalty/games/ruleta/config", {
				method: "PUT",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ config: payload }),
			});
			const body = (await response.json()) as RouletteConfigResponse & {
				error?: { description?: string };
			};

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo guardar la configuración.");
				return;
			}

			if (body.config) {
				setConfig(cloneConfig(body.config));
				setSavedConfig(cloneConfig(body.config));
			}

			setIsEnabled(body.isEnabled);
			setSuccess("Configuración guardada.");
		} catch {
			setSubmitError("Error de red al guardar.");
		} finally {
			setSaving(false);
		}
	};

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (session.role !== "owner") {
		return (
			<Card>
				<p className="text-sm text-muted">Solo el propietario puede configurar la ruleta.</p>
			</Card>
		);
	}

	if (!hasGamificationFeature) {
		return (
			<Card>
				<h2 className="font-medium text-foreground">Plan Premium requerido</h2>
				<p className="mt-2 text-sm text-muted">
					La ruleta está disponible en el plan Premium con gamificación activa.
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

	if (pageLoading) {
		return (
			<Card>
				<p className="text-sm text-muted">Cargando configuración…</p>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="font-medium text-foreground">Estado</h2>
						<p className="mt-1 text-sm text-muted">
							{isEnabled
								? "La ruleta está activa para tus clientes."
								: "Activa la ruleta para que los clientes puedan girar tras una visita."}
						</p>
					</div>
					<Button
						type="button"
						variant={isEnabled ? "secondary" : "primary"}
						disabled={toggling}
						onClick={() => void handleToggleEnabled()}
					>
						{toggling ? "Guardando…" : isEnabled ? "Desactivar" : "Activar ruleta"}
					</Button>
				</div>
			</Card>

			<Card>
				<h2 className="font-medium text-foreground">Vista previa</h2>
				<p className="mt-1 text-sm text-muted">
					Distribución aproximada según los pesos actuales (sin animación).
				</p>
				<div className="mt-4">
					<RouletteWheelPreview config={config} />
				</div>
			</Card>

			<Card>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 className="font-medium text-foreground">Segmentos</h2>
					<Button
						type="button"
						variant="secondary"
						disabled={config.segments.length >= MAX_ROULETTE_SEGMENTS}
						onClick={addSegment}
					>
						Añadir segmento
					</Button>
				</div>
				<p className="mt-1 text-sm text-muted">
					Mínimo {MIN_ROULETTE_SEGMENTS}, máximo {MAX_ROULETTE_SEGMENTS}. Los pesos definen la
					probabilidad relativa.
				</p>

				<div className="mt-4 space-y-4">
					{config.segments.map((segment, index) => (
						<div
							key={segment.id}
							className="rounded-theme border border-border p-4 space-y-3"
						>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-sm font-medium text-foreground">Segmento {index + 1}</p>
								<Button
									type="button"
									variant="ghost"
									disabled={config.segments.length <= MIN_ROULETTE_SEGMENTS}
									onClick={() => removeSegment(index)}
								>
									Eliminar
								</Button>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<Field label="Etiqueta">
									<Input
										value={segment.label}
										onChange={(event) =>
											updateSegment(index, { label: event.target.value })
										}
									/>
								</Field>
								<Field label="Peso">
									<Input
										type="number"
										min={1}
										value={segment.weight}
										onChange={(event) =>
											updateSegment(index, {
												weight: Math.max(1, Number(event.target.value) || 1),
											})
										}
									/>
								</Field>
								<Field label="Color (opcional)">
									<Input
										value={segment.color ?? ""}
										placeholder="#6366f1"
										onChange={(event) =>
											updateSegment(index, {
												color: event.target.value.trim() || undefined,
											})
										}
									/>
								</Field>
								<Field label="Tipo de premio">
									<select
										className={SELECT_CLASS}
										value={segment.prizeType}
										onChange={(event) => {
											const prizeType = event.target.value as RoulettePrizeType;
											updateSegment(index, {
												prizeType,
												prize: {},
												stockLimit: prizeType === "physical" ? 10 : null,
											});
										}}
									>
										{PRIZE_TYPE_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</Field>
							</div>

							{segment.prizeType === "points" ? (
								<Field label="Puntos">
									<Input
										type="number"
										min={1}
										value={segment.prize.points ?? 10}
										onChange={(event) =>
											updateSegment(index, {
												prize: {
													points: Math.max(1, Number(event.target.value) || 1),
												},
											})
										}
									/>
								</Field>
							) : null}

							{segment.prizeType === "stamp" ? (
								<Field label="Campaña de sellos">
									{activeCampaigns.length === 0 ? (
										<p className="text-sm text-muted">
											Crea una campaña activa en{" "}
											<Link href="/settings/stamps" className="text-primary hover:underline">
												Sellos
											</Link>
											.
										</p>
									) : (
										<select
											className={SELECT_CLASS}
											value={segment.prize.campaignId ?? ""}
											onChange={(event) =>
												updateSegment(index, {
													prize: { campaignId: event.target.value },
												})
											}
										>
											<option value="">Selecciona campaña</option>
											{activeCampaigns.map((campaign) => (
												<option key={campaign.id} value={campaign.id}>
													{campaign.name}
												</option>
											))}
										</select>
									)}
								</Field>
							) : null}

							{segment.prizeType === "promotion" ? (
								<Field label="Promoción">
									{activePromotions.length === 0 ? (
										<p className="text-sm text-muted">
											Crea una promoción activa en{" "}
											<Link
												href="/settings/promotions"
												className="text-primary hover:underline"
											>
												Promociones
											</Link>
											.
										</p>
									) : (
										<select
											className={SELECT_CLASS}
											value={segment.prize.promotionId ?? ""}
											onChange={(event) =>
												updateSegment(index, {
													prize: { promotionId: event.target.value },
												})
											}
										>
											<option value="">Selecciona promoción</option>
											{activePromotions.map((promotion) => (
												<option key={promotion.id} value={promotion.id}>
													{promotion.title}
												</option>
											))}
										</select>
									)}
								</Field>
							) : null}

							{segment.prizeType === "physical" ? (
								<div className="grid gap-3 sm:grid-cols-2">
									<Field label="Descripción del premio">
										<Input
											value={segment.prize.description ?? ""}
											onChange={(event) =>
												updateSegment(index, {
													prize: { description: event.target.value },
												})
											}
										/>
									</Field>
									<Field label="Stock máximo">
										<Input
											type="number"
											min={1}
											value={segment.stockLimit ?? 10}
											onChange={(event) =>
												updateSegment(index, {
													stockLimit: Math.max(1, Number(event.target.value) || 1),
												})
											}
										/>
									</Field>
									{segment.stockUsed > 0 ? (
										<p className="text-xs text-muted sm:col-span-2">
											Entregados: {segment.stockUsed}
											{segment.stockLimit !== null ? ` / ${segment.stockLimit}` : ""}
										</p>
									) : null}
									{activeRewards.length > 0 ? (
										<Field label="Recompensa vinculada (opcional)">
											<select
												className={SELECT_CLASS}
												value={segment.prize.rewardId ?? ""}
												onChange={(event) =>
													updateSegment(index, {
														prize: {
															...segment.prize,
															rewardId: event.target.value || undefined,
														},
													})
												}
											>
												<option value="">Ninguna</option>
												{activeRewards.map((reward) => (
													<option key={reward.id} value={reward.id}>
														{reward.name}
													</option>
												))}
											</select>
										</Field>
									) : null}
								</div>
							) : null}
						</div>
					))}
				</div>
			</Card>

			<Card>
				<h2 className="font-medium text-foreground">Reglas de giro</h2>
				<div className="mt-4 grid gap-3 sm:grid-cols-3">
					<Field label="Máx. giros por día">
						<Input
							type="number"
							min={1}
							value={config.rules.maxSpinsPerDay}
							onChange={(event) =>
								updateRules({
									maxSpinsPerDay: Math.max(1, Number(event.target.value) || 1),
								})
							}
						/>
					</Field>
					<Field label="Máx. giros por semana">
						<Input
							type="number"
							min={1}
							value={config.rules.maxSpinsPerWeek}
							onChange={(event) =>
								updateRules({
									maxSpinsPerWeek: Math.max(1, Number(event.target.value) || 1),
								})
							}
						/>
					</Field>
					<Field label="Validez tras visita (horas)">
						<Input
							type="number"
							min={1}
							value={config.rules.eligibilityTtlHours}
							onChange={(event) =>
								updateRules({
									eligibilityTtlHours: Math.max(1, Number(event.target.value) || 1),
								})
							}
						/>
					</Field>
				</div>
				<p className="mt-3 text-xs text-muted">
					Disparador: tras escaneo del staff ({config.rules.trigger}).
				</p>
			</Card>

			{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
			{success ? <p className="text-sm text-success">{success}</p> : null}

			<div className="flex flex-wrap gap-3">
				<Button type="button" disabled={saving} onClick={() => void handleSave()}>
					{saving ? "Guardando…" : "Guardar configuración"}
				</Button>
				<Link
					href="/settings/games"
					className="inline-flex items-center text-sm text-muted hover:text-foreground"
				>
					← Volver a juegos
				</Link>
			</div>
		</div>
	);
}
