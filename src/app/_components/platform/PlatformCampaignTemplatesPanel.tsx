"use client";

import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import type { PlatformCampaignTemplateResponse } from "../../../lib/platform/campaignTemplates";
import {
	LOYALTY_CARD_BACKGROUNDS,
	type LoyaltyCardBackgroundVariant,
} from "../loyalty/loyaltyCardBackgrounds";
import {
	type LoyaltyVisualTemplate,
	LOYALTY_VISUAL_TEMPLATES,
} from "../loyalty/loyaltyVisualTemplates";
import { LoyaltyCardBackgroundSwatch } from "../loyalty/LoyaltyCardBackground";
import { LoyaltyProgress } from "../loyalty/LoyaltyProgress";
import { LoyaltyVisualTemplatePicker } from "../loyalty/LoyaltyVisualTemplatePicker";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type TemplatesResponse = {
	templates?: PlatformCampaignTemplateResponse[];
	error?: { description?: string };
};

type TemplateFormState = {
	name: string;
	description: string;
	requiredStamps: string;
	suggestedStampTypeLabel: string;
	visualTemplate: LoyaltyVisualTemplate;
	cardBackgroundVariant: LoyaltyCardBackgroundVariant;
	conditions: string;
	sortOrder: string;
};

const TEXTAREA_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60 min-h-[4rem] resize-y";

function emptyForm(): TemplateFormState {
	return {
		name: "",
		description: "",
		requiredStamps: "10",
		suggestedStampTypeLabel: "",
		visualTemplate: "generic",
		cardBackgroundVariant: "coffee-photo",
		conditions: "",
		sortOrder: "",
	};
}

function templateToForm(template: PlatformCampaignTemplateResponse): TemplateFormState {
	return {
		name: template.name,
		description: template.description,
		requiredStamps: String(template.requiredStamps),
		suggestedStampTypeLabel: template.suggestedStampTypeLabel,
		visualTemplate: template.visualTemplate as LoyaltyVisualTemplate,
		cardBackgroundVariant: template.cardBackgroundVariant as LoyaltyCardBackgroundVariant,
		conditions: template.conditions,
		sortOrder: String(template.sortOrder),
	};
}

function TemplateFormFields({
	form,
	onChange,
	previewRequired,
}: {
	form: TemplateFormState;
	onChange: (patch: Partial<TemplateFormState>) => void;
	previewRequired: number;
}): ReactElement {
	return (
		<div className="flex flex-col gap-4">
			<Field label="Nombre">
				<Input
					id="template-name"
					value={form.name}
					onChange={(event) => onChange({ name: event.target.value })}
					placeholder="10 cafés = 1 gratis"
				/>
			</Field>
			<Field label="Descripción">
				<textarea
					id="template-description"
					className={TEXTAREA_CLASS}
					value={form.description}
					onChange={(event) => onChange({ description: event.target.value })}
					placeholder="Texto orientativo para el comerciante"
				/>
			</Field>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Sellos requeridos">
					<Input
						id="template-stamps"
						type="number"
						min={1}
						value={form.requiredStamps}
						onChange={(event) => onChange({ requiredStamps: event.target.value })}
					/>
				</Field>
				<Field label="Tipo sugerido (etiqueta)">
					<Input
						id="template-label"
						value={form.suggestedStampTypeLabel}
						onChange={(event) => onChange({ suggestedStampTypeLabel: event.target.value })}
						placeholder="Café, Croissant, Matcha…"
					/>
				</Field>
			</div>
			<Field label="Condiciones (opcional)">
				<textarea
					id="template-conditions"
					className={TEXTAREA_CLASS}
					value={form.conditions}
					onChange={(event) => onChange({ conditions: event.target.value })}
				/>
			</Field>
			<Field label="Plantilla visual">
				<LoyaltyVisualTemplatePicker
					value={form.visualTemplate}
					onChange={(template) => onChange({ visualTemplate: template })}
					previewRequired={previewRequired}
					previewCurrent={Math.min(3, Math.max(1, previewRequired - 1))}
				/>
			</Field>
			<Field label="Fondo de tarjeta">
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{LOYALTY_CARD_BACKGROUNDS.map((background) => (
						<LoyaltyCardBackgroundSwatch
							key={background.id}
							variant={background.id}
							selected={form.cardBackgroundVariant === background.id}
							onSelect={() => onChange({ cardBackgroundVariant: background.id })}
						/>
					))}
				</div>
			</Field>
			<div className="rounded-theme border border-border bg-background p-4">
				<p className="mb-2 text-sm font-medium text-foreground">Vista previa</p>
				<LoyaltyProgress
					template={form.visualTemplate}
					current={Math.min(3, Math.max(1, previewRequired - 1))}
					required={previewRequired}
				/>
			</div>
		</div>
	);
}

export function PlatformCampaignTemplatesPanel(): ReactElement {
	const [templates, setTemplates] = useState<PlatformCampaignTemplateResponse[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [createForm, setCreateForm] = useState<TemplateFormState>(emptyForm);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<TemplateFormState>(emptyForm);
	const [savingCreate, setSavingCreate] = useState(false);
	const [savingEditId, setSavingEditId] = useState<string | null>(null);
	const [togglingId, setTogglingId] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/campaign-templates", { credentials: "include" });
			const body = (await response.json()) as TemplatesResponse;

			if (!response.ok) {
				setError(body.error?.description ?? "No se pudo cargar las plantillas");
				setTemplates(null);

				return;
			}

			setTemplates(body.templates ?? []);
		} catch {
			setError("No se pudo conectar con el servidor");
			setTemplates(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const createStamps = Number.parseInt(createForm.requiredStamps, 10);
	const editStamps = Number.parseInt(editForm.requiredStamps, 10);

	function visualLabel(templateId: string): string {
		return LOYALTY_VISUAL_TEMPLATES.find((row) => row.id === templateId)?.label ?? templateId;
	}

	async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setActionError(null);
		setSuccess(null);
		setSavingCreate(true);

		try {
			const response = await fetch("/api/platform/campaign-templates", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: createForm.name.trim(),
					description: createForm.description.trim(),
					requiredStamps: createStamps,
					suggestedStampTypeLabel: createForm.suggestedStampTypeLabel.trim(),
					visualTemplate: createForm.visualTemplate,
					cardBackgroundVariant: createForm.cardBackgroundVariant,
					conditions: createForm.conditions.trim(),
					...(createForm.sortOrder.trim()
						? { sortOrder: Number.parseInt(createForm.sortOrder, 10) }
						: {}),
				}),
			});
			const body = (await response.json()) as TemplatesResponse & {
				template?: PlatformCampaignTemplateResponse;
			};

			if (!response.ok) {
				setActionError(body.error?.description ?? "No se pudo crear la plantilla");

				return;
			}

			setSuccess(`Plantilla «${body.template?.name ?? createForm.name}» creada`);
			setCreateForm(emptyForm());
			await load();
		} catch {
			setActionError("Error de red al crear la plantilla");
		} finally {
			setSavingCreate(false);
		}
	}

	function startEdit(template: PlatformCampaignTemplateResponse): void {
		setEditingId(template.id);
		setEditForm(templateToForm(template));
		setActionError(null);
		setSuccess(null);
	}

	async function handleSaveEdit(event: FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		if (!editingId) {
			return;
		}

		setActionError(null);
		setSuccess(null);
		setSavingEditId(editingId);

		try {
			const response = await fetch(`/api/platform/campaign-templates/${editingId}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: editForm.name.trim(),
					description: editForm.description.trim(),
					requiredStamps: editStamps,
					suggestedStampTypeLabel: editForm.suggestedStampTypeLabel.trim(),
					visualTemplate: editForm.visualTemplate,
					cardBackgroundVariant: editForm.cardBackgroundVariant,
					conditions: editForm.conditions.trim(),
					sortOrder: Number.parseInt(editForm.sortOrder, 10),
				}),
			});
			const body = (await response.json()) as TemplatesResponse & {
				template?: PlatformCampaignTemplateResponse;
			};

			if (!response.ok) {
				setActionError(body.error?.description ?? "No se pudo guardar la plantilla");

				return;
			}

			setSuccess(`Plantilla «${body.template?.name ?? editForm.name}» actualizada`);
			setEditingId(null);
			await load();
		} catch {
			setActionError("Error de red al guardar la plantilla");
		} finally {
			setSavingEditId(null);
		}
	}

	async function toggleActive(template: PlatformCampaignTemplateResponse): Promise<void> {
		setActionError(null);
		setSuccess(null);
		setTogglingId(template.id);

		try {
			const response = await fetch(`/api/platform/campaign-templates/${template.id}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: !template.isActive }),
			});
			const body = (await response.json()) as TemplatesResponse;

			if (!response.ok) {
				setActionError(body.error?.description ?? "No se pudo cambiar el estado");

				return;
			}

			setSuccess(
				template.isActive
					? `Plantilla «${template.name}» desactivada`
					: `Plantilla «${template.name}» activada`,
			);
			await load();
		} catch {
			setActionError("Error de red al cambiar el estado");
		} finally {
			setTogglingId(null);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<Card className="p-6">
				<h2 className="font-medium text-foreground">Nueva plantilla</h2>
				<p className="mt-1 text-sm text-muted">
					Las plantillas activas estarán disponibles para que los comerciantes las adopten.
				</p>
				<form className="mt-4 flex flex-col gap-4" onSubmit={(event) => void handleCreate(event)}>
					<TemplateFormFields
						form={createForm}
						onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
						previewRequired={
							Number.isInteger(createStamps) && createStamps >= 1 ? createStamps : 10
						}
					/>
					<div className="flex justify-end">
						<Button type="submit" disabled={savingCreate}>
							{savingCreate ? "Creando…" : "Crear plantilla"}
						</Button>
					</div>
				</form>
			</Card>

			<Card className="overflow-hidden p-0">
				<div className="border-b border-border px-6 py-4">
					<h2 className="font-medium text-foreground">Plantillas</h2>
					<p className="mt-1 text-sm text-muted">
						{templates?.length ?? 0}{" "}
						{(templates?.length ?? 0) === 1 ? "plantilla" : "plantillas"} en la biblioteca global
					</p>
				</div>

				{loading ? (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[880px] text-left text-sm">
							<thead>
								<tr className="border-b border-border bg-background">
									<th className="px-6 py-3 font-medium text-muted">Nombre</th>
									<th className="px-6 py-3 font-medium text-muted">Sellos</th>
									<th className="px-6 py-3 font-medium text-muted">Tipo sugerido</th>
									<th className="px-6 py-3 font-medium text-muted">Visual</th>
									<th className="px-6 py-3 font-medium text-muted">Estado</th>
									<th className="px-6 py-3 font-medium text-muted">Acciones</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td colSpan={6} className="px-6 py-4 text-sm text-muted">
										Cargando plantillas…
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				) : error ? (
					<p className="px-6 py-4 text-sm text-error">{error}</p>
				) : !templates || templates.length === 0 ? (
					<p className="px-6 py-4 text-sm text-muted">No hay plantillas todavía.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[880px] text-left text-sm">
							<thead>
								<tr className="border-b border-border bg-background">
									<th className="px-6 py-3 font-medium text-muted">Nombre</th>
									<th className="px-6 py-3 font-medium text-muted">Sellos</th>
									<th className="px-6 py-3 font-medium text-muted">Tipo sugerido</th>
									<th className="px-6 py-3 font-medium text-muted">Visual</th>
									<th className="px-6 py-3 font-medium text-muted">Estado</th>
									<th className="px-6 py-3 font-medium text-muted">Acciones</th>
								</tr>
							</thead>
							<tbody>
								{templates.map((template) => (
									<tr key={template.id} className="border-b border-border last:border-b-0">
										<td className="px-6 py-3">
											<p className="font-medium text-foreground">{template.name}</p>
											{template.description ? (
												<p className="mt-0.5 text-xs text-muted">{template.description}</p>
											) : null}
										</td>
										<td className="px-6 py-3 text-foreground">{template.requiredStamps}</td>
										<td className="px-6 py-3 text-muted">
											{template.suggestedStampTypeLabel || "—"}
										</td>
										<td className="px-6 py-3 text-muted">{visualLabel(template.visualTemplate)}</td>
										<td className="px-6 py-3">
											<span
												className={
													template.isActive
														? "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"
														: "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted"
												}
											>
												{template.isActive ? "Activa" : "Inactiva"}
											</span>
										</td>
										<td className="px-6 py-3">
											<div className="flex flex-wrap gap-2">
												<Button
													type="button"
													variant="secondary"
													className="text-xs"
													onClick={() => startEdit(template)}
												>
													Editar
												</Button>
												<Button
													type="button"
													variant="secondary"
													className="text-xs"
													disabled={togglingId !== null}
													onClick={() => void toggleActive(template)}
												>
													{togglingId === template.id
														? "Guardando…"
														: template.isActive
															? "Desactivar"
															: "Activar"}
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			{editingId ? (
				<Card className="p-6">
					<h2 className="font-medium text-foreground">Editar plantilla</h2>
					<form className="mt-4 flex flex-col gap-4" onSubmit={(event) => void handleSaveEdit(event)}>
						<TemplateFormFields
							form={editForm}
							onChange={(patch) => setEditForm((current) => ({ ...current, ...patch }))}
							previewRequired={Number.isInteger(editStamps) && editStamps >= 1 ? editStamps : 10}
						/>
						<Field label="Orden">
							<Input
								id="template-sort-order"
								type="number"
								min={0}
								value={editForm.sortOrder}
								onChange={(event) => setEditForm((current) => ({ ...current, sortOrder: event.target.value }))}
							/>
						</Field>
						<div className="flex flex-wrap justify-end gap-2">
							<Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
								Cancelar
							</Button>
							<Button type="submit" disabled={savingEditId !== null}>
								{savingEditId ? "Guardando…" : "Guardar cambios"}
							</Button>
						</div>
					</form>
				</Card>
			) : null}

			{actionError ? <p className="text-sm text-error">{actionError}</p> : null}
			{success ? <p className="text-sm text-foreground">{success}</p> : null}
		</div>
	);
}
