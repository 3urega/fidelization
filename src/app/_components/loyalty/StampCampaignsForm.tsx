"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type CampaignPayload = {
	id: string;
	name: string;
	requiredStamps: number;
	isActive: boolean;
	stampTypeId?: string | null;
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

type StampCampaignsFormProps = {
	hasActiveTypes: boolean;
	onGoToTypesTab: () => void;
};

export function StampCampaignsForm({
	hasActiveTypes,
	onGoToTypesTab,
}: StampCampaignsFormProps): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [campaigns, setCampaigns] = useState<CampaignPayload[]>([]);
	const [stampTypes, setStampTypes] = useState<StampTypePayload[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [name, setName] = useState("");
	const [requiredStamps, setRequiredStamps] = useState("10");
	const [stampTypeId, setStampTypeId] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

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
	}, [session, loadCampaigns, loadStampTypes]);

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
				setRequiredStamps("10");
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
									<p className="text-sm text-muted">
										{campaign.requiredStamps} sellos
										{campaign.stampTypeId
											? ` · ${stampTypes.find((type) => type.id === campaign.stampTypeId)?.label ?? "Tipo"}`
											: " · Sin tipo (legacy)"}
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
									) : null}
								</div>
							</li>
						))}
					</ul>
				)}
			</Card>

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
