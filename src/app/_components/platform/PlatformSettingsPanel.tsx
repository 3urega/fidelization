"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import type {
	PlatformIntegrationGroupResponse,
	PlatformSettingsResponse,
} from "../../../lib/platform/settings";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { notifyPlatformSettingsUpdated } from "./PlatformBrandingProvider";

type SettingsResponse = PlatformSettingsResponse & {
	error?: { description?: string };
};

type PatchResponse = {
	branding?: PlatformSettingsResponse["branding"];
	error?: { description?: string };
};

function IntegrationStatusBadge({ configured }: { configured: boolean }): ReactElement {
	return (
		<span
			className={[
				"inline-flex rounded-theme px-2 py-0.5 text-xs font-medium",
				configured ? "bg-success/15 text-success" : "bg-border/60 text-muted",
			].join(" ")}
		>
			{configured ? "Configurado" : "Falta"}
		</span>
	);
}

function IntegrationGroupCard({ group }: { group: PlatformIntegrationGroupResponse }): ReactElement {
	return (
		<Card>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
				<IntegrationStatusBadge configured={group.configured} />
			</div>
			<ul className="mt-4 space-y-3">
				{group.items.map((item) => (
					<li key={item.key} className="flex flex-wrap items-start justify-between gap-2 text-sm">
						<div className="min-w-0">
							<p className="font-mono text-xs text-foreground">{item.label}</p>
							{item.hint ? <p className="mt-1 text-xs text-muted">{item.hint}</p> : null}
						</div>
						<IntegrationStatusBadge configured={item.configured} />
					</li>
				))}
			</ul>
		</Card>
	);
}

export function PlatformSettingsPanel(): ReactElement {
	const [displayName, setDisplayName] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const [integrations, setIntegrations] = useState<PlatformIntegrationGroupResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/settings", {
				credentials: "include",
			});

			if (!response.ok) {
				setError("No se pudo cargar la configuración");
				setIntegrations([]);

				return;
			}

			const data = (await response.json()) as SettingsResponse;
			setDisplayName(data.branding.displayName);
			setLogoUrl(data.branding.logoUrl);
			setIntegrations(data.integrations.groups);
		} catch {
			setError("No se pudo cargar la configuración");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setSaving(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/platform/settings", {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ displayName, logoUrl }),
			});

			const data = (await response.json()) as PatchResponse;

			if (!response.ok) {
				setError(data.error?.description ?? "No se pudo guardar la configuración");

				return;
			}

			if (data.branding) {
				setDisplayName(data.branding.displayName);
				setLogoUrl(data.branding.logoUrl);
			}

			setSuccess("Branding actualizado");
			notifyPlatformSettingsUpdated();
		} catch {
			setError("No se pudo guardar la configuración");
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
				<Card>
					<h2 className="text-base font-semibold text-foreground">Branding plataforma</h2>
					<p className="mt-1 text-sm text-muted">
						Nombre y logo visibles en el panel superadmin (no afecta a los negocios).
					</p>

					<div className="mt-4 grid gap-4 md:grid-cols-2">
						<Field label="Nombre visible">
							<Input
								id="platform-display-name"
								value={displayName}
								onChange={(event) => {
									setDisplayName(event.target.value);
								}}
								required
							/>
						</Field>

						<div className="flex flex-col gap-1.5">
							<Field label="Logo URL">
								<Input
									id="platform-logo-url"
									value={logoUrl}
									onChange={(event) => {
										setLogoUrl(event.target.value);
									}}
									placeholder="https://…"
								/>
							</Field>
							<p className="text-xs text-muted">Opcional. URL http(s) a imagen cuadrada o horizontal.</p>
						</div>
					</div>

					{logoUrl.trim() ? (
						<div className="mt-4 flex items-center gap-3">
							<span className="text-xs text-muted">Vista previa</span>
							<img
								src={logoUrl}
								alt=""
								className="h-10 w-10 rounded-theme border border-border object-contain"
							/>
						</div>
					) : null}

					{error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
					{success ? <p className="mt-4 text-sm text-success">{success}</p> : null}

					<div className="mt-4">
						<Button type="submit" disabled={saving}>
							{saving ? "Guardando…" : "Guardar branding"}
						</Button>
					</div>
				</Card>
			</form>

			<div className="flex flex-col gap-4">
				<div>
					<h2 className="text-base font-semibold text-foreground">Integraciones</h2>
					<p className="mt-1 text-sm text-muted">
						Estado de variables de entorno (solo lectura). Los secretos se configuran fuera del panel.
						Consulta{" "}
						<a
							href="https://github.com/3urega/fidelization/blob/main/docs/backend/external-services-env.md"
							className="text-primary underline-offset-2 hover:underline"
							target="_blank"
							rel="noreferrer"
						>
							external-services-env.md
						</a>
						.
					</p>
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					{integrations.map((group) => (
						<IntegrationGroupCard key={group.key} group={group} />
					))}
				</div>
			</div>
		</div>
	);
}
