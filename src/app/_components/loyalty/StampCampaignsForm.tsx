"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { LoyaltyCardBackground, LoyaltyCardBackgroundSwatch } from "./LoyaltyCardBackground";
import { LoyaltyProgress } from "./LoyaltyProgress";
import { LoyaltyVisualTemplatePicker } from "./LoyaltyVisualTemplatePicker";
import {
	LOYALTY_CARD_BACKGROUNDS,
	type LoyaltyCardBackgroundVariant,
} from "./loyaltyCardBackgrounds";
import {
	type LoyaltyVisualTemplate,
	resolveLoyaltyVisualTemplate,
} from "./loyaltyVisualTemplates";

type CampaignPayload = {
	id: string;
	name: string;
	requiredStamps: number;
	isActive: boolean;
	stampTypeId?: string | null;
	visualTemplate?: string;
	cardBackgroundVariant?: string;
	conditions?: string;
};

type StampTypePayload = {
	id: string;
	label: string;
	isActive: boolean;
};

type CampaignsResponse = {
	campaigns?: CampaignPayload[];
	campaign?: CampaignPayload;
	error?: {
		description?: string;
	};
};

type PlatformTemplatePayload = {
	id: string;
	name: string;
	description: string;
	requiredStamps: number;
	suggestedStampTypeLabel: string;
	visualTemplate: string;
	cardBackgroundVariant: string;
	conditions: string;
};

type TemplatesResponse = {
	templates?: PlatformTemplatePayload[];
	error?: { description?: string };
};

function resolveStampTypeIdForTemplate(
	types: StampTypePayload[],
	suggestedLabel: string,
): string {
	if (types.length === 0) {
		return "";
	}

	const normalized = suggestedLabel.trim().toLowerCase();
	if (!normalized) {
		return types[0]?.id ?? "";
	}

	const exact = types.find((type) => type.label.trim().toLowerCase() === normalized);
	if (exact) {
		return exact.id;
	}

	const partial = types.find((type) => type.label.trim().toLowerCase().includes(normalized));
	if (partial) {
		return partial.id;
	}

	return types[0]?.id ?? "";
}

type StampCampaignsFormProps = {
	hasActiveTypes: boolean;
	onGoToTypesTab: () => void;
};

const TEXTAREA_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60 min-h-[5rem] resize-y";

export function StampCampaignsForm({
	hasActiveTypes,
	onGoToTypesTab,
}: StampCampaignsFormProps): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [campaigns, setCampaigns] = useState<CampaignPayload[]>([]);
	const [stampTypes, setStampTypes] = useState<StampTypePayload[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [name, setName] = useState("");
	const [conditions, setConditions] = useState("");
	const [requiredStamps, setRequiredStamps] = useState("10");
	const [stampTypeId, setStampTypeId] = useState("");
	const [visualTemplate, setVisualTemplate] = useState<LoyaltyVisualTemplate>("generic");
	const [cardBackgroundVariant, setCardBackgroundVariant] =
		useState<LoyaltyCardBackgroundVariant>("coffee-photo");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [platformTemplates, setPlatformTemplates] = useState<PlatformTemplatePayload[]>([]);
	const [templatesLoading, setTemplatesLoading] = useState(true);
	const [templateStampTypeIds, setTemplateStampTypeIds] = useState<Record<string, string>>({});
	const [adoptingTemplateId, setAdoptingTemplateId] = useState<string | null>(null);

	const loadStampTypes = useCallback(async (): Promise<void> => {
		try {
			const response = await fetch("/api/loyalty/stamp-types", {
				credentials: "include",
			});
			const body = (await response.json()) as { types?: StampTypePayload[] };

			if (response.ok) {
				setStampTypes((body.types ?? []).filter((type) => type.isActive));
			}
		} catch {
			setStampTypes([]);
		}
	}, []);

	const loadPlatformTemplates = useCallback(async (): Promise<void> => {
		setTemplatesLoading(true);

		try {
			const response = await fetch("/api/loyalty/campaign-templates", {
				credentials: "include",
			});
			const body = (await response.json()) as TemplatesResponse;

			if (response.ok) {
				setPlatformTemplates(body.templates ?? []);
			} else {
				setPlatformTemplates([]);
			}
		} catch {
			setPlatformTemplates([]);
		} finally {
			setTemplatesLoading(false);
		}
	}, []);

	const loadCampaigns = useCallback(async (): Promise<void> => {
		setListLoading(true);

		try {
			const response = await fetch("/api/loyalty/stamp-campaigns", {
				credentials: "include",
			});
			const body = (await response.json()) as CampaignsResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudieron cargar las campañas.");
				setCampaigns([]);

				return;
			}

			setCampaigns(body.campaigns ?? []);
		} catch {
			setSubmitError("Error de red al cargar las campañas.");
			setCampaigns([]);
		} finally {
			setListLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!session || session.role !== "owner") {
			return;
		}

		void loadCampaigns();
		void loadStampTypes();
		void loadPlatformTemplates();
	}, [session, loadCampaigns, loadStampTypes, loadPlatformTemplates]);

	useEffect(() => {
		if (stampTypes.length === 0 || platformTemplates.length === 0) {
			return;
		}

		setTemplateStampTypeIds((current) => {
			const next = { ...current };

			for (const template of platformTemplates) {
				if (!next[template.id]) {
					next[template.id] = resolveStampTypeIdForTemplate(
						stampTypes,
						template.suggestedStampTypeLabel,
					);
				}
			}

			return next;
		});
	}, [stampTypes, platformTemplates]);

	useEffect(() => {
		if (stampTypes.length === 0) {
			setStampTypeId("");

			return;
		}

		setStampTypeId((current) =>
			current && stampTypes.some((type) => type.id === current) ? current : stampTypes[0].id,
		);
	}, [stampTypes]);

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
					Solo el propietario del negocio puede configurar campañas de sellos.
				</p>
			</Card>
		);
	}

	const parsedStamps = Number.parseInt(requiredStamps, 10);
	const stampsValid = Number.isInteger(parsedStamps) && parsedStamps >= 1;
	const nameValid = name.trim().length > 0;
	const typeValid = stampTypeId.trim().length > 0;

	async function handleCreate(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setSubmitError(null);
		setSuccess(null);

		if (!hasActiveTypes) {
			setSubmitError("Crea al menos un tipo de consumición antes de añadir campañas.");

			return;
		}

		if (!nameValid || !stampsValid || !typeValid) {
			setSubmitError("Revisa el nombre, los sellos (mínimo 1) y el tipo de consumición.");

			return;
		}

		setSaving(true);

		try {
			const response = await fetch("/api/loyalty/stamp-campaigns", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					requiredStamps: parsedStamps,
					stampTypeId: stampTypeId.trim(),
					visualTemplate,
					cardBackgroundVariant,
					...(conditions.trim() ? { conditions: conditions.trim() } : {}),
				}),
			});

			const body = (await response.json()) as CampaignsResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo crear la campaña.");

				return;
			}

			if (body.campaign) {
				setSuccess(
					`Campaña creada: «${body.campaign.name}» · ${body.campaign.requiredStamps} sellos para completar.`,
				);
				setName("");
				setConditions("");
				setRequiredStamps("10");
				setVisualTemplate("generic");
				setCardBackgroundVariant("coffee-photo");
				if (stampTypes[0]) {
					setStampTypeId(stampTypes[0].id);
				}
				await loadCampaigns();
			}
		} catch {
			setSubmitError("Error de red al crear la campaña.");
		} finally {
			setSaving(false);
		}
	}

	async function handleDeactivate(campaignId: string): Promise<void> {
		setSubmitError(null);
		setSuccess(null);
		setDeactivatingId(campaignId);

		try {
			const response = await fetch(`/api/loyalty/stamp-campaigns/${campaignId}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: false }),
			});

			const body = (await response.json()) as CampaignsResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo desactivar la campaña.");

				return;
			}

			setSuccess("Campaña desactivada.");
			await loadCampaigns();
		} catch {
			setSubmitError("Error de red al desactivar la campaña.");
		} finally {
			setDeactivatingId(null);
		}
	}

	async function handleDelete(campaignId: string, campaignName: string): Promise<void> {
		if (
			!window.confirm(
				`¿Eliminar la campaña «${campaignName}»? Esta acción no se puede deshacer.`,
			)
		) {
			return;
		}

		setSubmitError(null);
		setSuccess(null);
		setDeletingId(campaignId);

		try {
			const response = await fetch(`/api/loyalty/stamp-campaigns/${campaignId}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (response.status === 204) {
				setSuccess("Campaña eliminada.");
				await loadCampaigns();

				return;
			}

			const body = (await response.json()) as CampaignsResponse;

			setSubmitError(body.error?.description ?? "No se pudo eliminar la campaña.");
		} catch {
			setSubmitError("Error de red al eliminar la campaña.");
		} finally {
			setDeletingId(null);
		}
	}

	async function handleAdoptTemplate(template: PlatformTemplatePayload): Promise<void> {
		setSubmitError(null);
		setSuccess(null);

		if (!hasActiveTypes) {
			setSubmitError("Crea al menos un tipo de consumición antes de usar plantillas.");

			return;
		}

		const selectedStampTypeId = templateStampTypeIds[template.id]?.trim();
		if (!selectedStampTypeId) {
			setSubmitError("Elige un tipo de consumición para la plantilla.");

			return;
		}

		setAdoptingTemplateId(template.id);

		try {
			const response = await fetch("/api/loyalty/stamp-campaigns/adopt-template", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					templateId: template.id,
					stampTypeId: selectedStampTypeId,
				}),
			});
			const body = (await response.json()) as CampaignsResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo adoptar la plantilla.");

				return;
			}

			if (body.campaign) {
				setSuccess(
					`Campaña creada desde plantilla: «${body.campaign.name}» · ${body.campaign.requiredStamps} sellos.`,
				);
				await loadCampaigns();
			}
		} catch {
			setSubmitError("Error de red al adoptar la plantilla.");
		} finally {
			setAdoptingTemplateId(null);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<h2 className="font-medium text-foreground">Tus campañas</h2>
				{listLoading ? (
					<p className="mt-3 text-sm text-muted">Cargando campañas…</p>
				) : campaigns.length === 0 ? (
					<p className="mt-3 text-sm text-muted">Aún no tienes campañas. Crea la primera abajo.</p>
				) : (
					<ul className="mt-4 flex flex-col gap-3">
						{campaigns.map((campaign) => (
							<li
								key={campaign.id}
								className="flex flex-col gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<p className="text-sm font-medium text-foreground">{campaign.name}</p>
									{campaign.conditions?.trim() ? (
										<p className="mt-1 text-sm text-muted">{campaign.conditions.trim()}</p>
									) : null}
									<p className="mt-1 text-sm text-muted">
										{campaign.requiredStamps} sellos
										{campaign.stampTypeId
											? ` · ${stampTypes.find((type) => type.id === campaign.stampTypeId)?.label ?? "Tipo"}`
											: " · Sin tipo (legacy)"}
										{` · ${resolveLoyaltyVisualTemplate(campaign.visualTemplate).label}`}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<span
										className={[
											"rounded-full px-2 py-0.5 text-xs font-medium",
											campaign.isActive
												? "bg-primary/10 text-primary"
												: "bg-muted text-muted-foreground",
										].join(" ")}
									>
										{campaign.isActive ? "Activa" : "Inactiva"}
									</span>
									{campaign.isActive ? (
										<Button
											type="button"
											variant="secondary"
											disabled={deactivatingId === campaign.id}
											onClick={() => void handleDeactivate(campaign.id)}
											className="shrink-0"
										>
											{deactivatingId === campaign.id ? "Desactivando…" : "Desactivar"}
										</Button>
									) : (
										<Button
											type="button"
											variant="secondary"
											disabled={deletingId === campaign.id}
											onClick={() => void handleDelete(campaign.id, campaign.name)}
											className="shrink-0"
										>
											{deletingId === campaign.id ? "Eliminando…" : "Eliminar"}
										</Button>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</Card>

			{hasActiveTypes ? (
				<Card>
					<h2 className="font-medium text-foreground">Usar plantilla</h2>
					<p className="mt-1 text-sm text-muted">
						Adopta una campaña predefinida de la plataforma y ajústala a tu negocio.
					</p>
					{templatesLoading ? (
						<p className="mt-3 text-sm text-muted">Cargando plantillas…</p>
					) : platformTemplates.length === 0 ? (
						<p className="mt-3 text-sm text-muted">No hay plantillas disponibles ahora mismo.</p>
					) : (
						<ul className="mt-4 flex flex-col gap-4">
							{platformTemplates.map((template) => {
								const selectedTypeId = templateStampTypeIds[template.id] ?? "";
								const adopting = adoptingTemplateId === template.id;

								return (
									<li
										key={template.id}
										className="rounded-theme border border-border p-4"
									>
										<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
											<div className="min-w-0 flex-1">
												<p className="font-medium text-foreground">{template.name}</p>
												{template.description ? (
													<p className="mt-1 text-sm text-muted">{template.description}</p>
												) : null}
												<p className="mt-2 text-sm text-muted">
													{template.requiredStamps} sellos
													{template.suggestedStampTypeLabel
														? ` · sugerido: ${template.suggestedStampTypeLabel}`
														: ""}
													{` · ${resolveLoyaltyVisualTemplate(template.visualTemplate).label}`}
												</p>
												<div className="mt-3 max-w-md">
													<LoyaltyProgress
														template={
															resolveLoyaltyVisualTemplate(template.visualTemplate).id
														}
														current={Math.min(
															3,
															Math.max(1, template.requiredStamps - 1),
														)}
														required={template.requiredStamps}
													/>
												</div>
											</div>
											<div className="flex w-full flex-col gap-3 lg:w-64">
												<Field label="Tipo de consumición">
													<select
														value={selectedTypeId}
														onChange={(event) =>
															setTemplateStampTypeIds((current) => ({
																...current,
																[template.id]: event.target.value,
															}))
														}
														className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
													>
														{stampTypes.map((type) => (
															<option key={type.id} value={type.id}>
																{type.label}
															</option>
														))}
													</select>
												</Field>
												<Button
													type="button"
													disabled={adoptingTemplateId !== null}
													onClick={() => void handleAdoptTemplate(template)}
												>
													{adopting ? "Creando…" : "Usar plantilla"}
												</Button>
											</div>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</Card>
			) : null}

			{hasActiveTypes ? (
				<Card>
					<h2 className="font-medium text-foreground">Nueva campaña</h2>
					<form className="mt-4 flex flex-col gap-5" onSubmit={(event) => void handleCreate(event)}>
						<Field label="Nombre de la campaña">
							<Input
								type="text"
								name="name"
								value={name}
								onChange={(event) => setName(event.target.value)}
								placeholder="10 cafés → 1 gratis"
								autoComplete="off"
								maxLength={120}
							/>
							<p className="mt-1 text-xs text-muted">
								Describe la promoción. Ejemplo: compra 10 veces y obtén un café gratis.
							</p>
						</Field>

						<Field label="Condiciones (opcional)">
							<textarea
								name="conditions"
								value={conditions}
								onChange={(event) => setConditions(event.target.value)}
								placeholder="Válido de lunes a viernes. No acumulable con otras promociones."
								maxLength={500}
								className={TEXTAREA_CLASS}
							/>
							<p className="mt-1 text-xs text-muted">
								Texto visible para el cliente en la tarjeta de sellos (requisitos, validez, etc.).
							</p>
						</Field>

						<Field label="Sellos necesarios">
							<Input
								type="number"
								name="requiredStamps"
								value={requiredStamps}
								onChange={(event) => setRequiredStamps(event.target.value)}
								min={1}
								step={1}
								className="max-w-[8rem]"
							/>
						</Field>

						<Field label="Tipo de consumición">
							<select
								name="stampTypeId"
								value={stampTypeId}
								onChange={(event) => setStampTypeId(event.target.value)}
								className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
								required
							>
								{stampTypes.map((type) => (
									<option key={type.id} value={type.id}>
										{type.label}
									</option>
								))}
							</select>
							<p className="mt-1 text-xs text-muted">
								El sello solo avanza cuando el empleado escanea con el botón de este tipo.
							</p>
						</Field>

						<Field label="Plantilla visual de sellos">
							<LoyaltyVisualTemplatePicker
								value={visualTemplate}
								onChange={setVisualTemplate}
								previewRequired={stampsValid ? parsedStamps : 10}
								previewCurrent={3}
							/>
						</Field>

						<Field label="Fondo de la tarjeta">
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
								{LOYALTY_CARD_BACKGROUNDS.map((background) => (
									<LoyaltyCardBackgroundSwatch
										key={background.id}
										variant={background.id}
										selected={cardBackgroundVariant === background.id}
										onSelect={() => setCardBackgroundVariant(background.id)}
									/>
								))}
							</div>
						</Field>

						<Field label="Vista previa">
							<LoyaltyCardBackground variant={cardBackgroundVariant}>
								<div className="flex flex-col gap-2">
									<p className="text-sm font-medium text-foreground">
										{name.trim() || "Tu campaña"}
									</p>
									{conditions.trim() ? (
										<p className="text-xs text-muted">{conditions.trim()}</p>
									) : null}
									<LoyaltyProgress
										template={visualTemplate}
										current={3}
										required={stampsValid ? parsedStamps : 10}
									/>
								</div>
							</LoyaltyCardBackground>
						</Field>

						{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
						{success ? <p className="text-sm text-foreground">{success}</p> : null}

						<Button
							type="submit"
							disabled={saving || !nameValid || !stampsValid || !typeValid}
							className="w-full sm:w-auto"
						>
							{saving ? "Creando…" : "Crear campaña"}
						</Button>
					</form>
				</Card>
			) : (
				<Card>
					<h2 className="font-medium text-foreground">Nueva campaña</h2>
					<p className="mt-2 text-sm text-muted">
						Crea al menos un tipo de consumición antes de añadir campañas de sellos.
					</p>
					<Button type="button" className="mt-4 w-full sm:w-auto" onClick={onGoToTypesTab}>
						Ir a tipos
					</Button>
				</Card>
			)}
		</div>
	);
}
