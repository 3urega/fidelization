"use client";

import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import type {
	PlatformBroadcastPreviewResponse,
	PlatformBroadcastRecipientResponse,
	PlatformBroadcastResponse,
} from "../../../lib/platform/communications";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type Channel = "email" | "push";
type AudienceType = "all_owners" | "all_app_users" | "tenant";

type TenantOption = {
	id: string;
	name: string;
	slug: string;
};

type BroadcastsListResponse = {
	broadcasts?: PlatformBroadcastResponse[];
	error?: { description?: string };
};

const TEXTAREA_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60 min-h-[6rem] resize-y";

const SELECT_CLASS =
	"block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60";

const AUDIENCE_LABELS: Record<AudienceType, string> = {
	all_owners: "Todos los comerciantes",
	all_app_users: "Todos los clientes app",
	tenant: "Staff de un negocio",
};

const CHANNEL_LABELS: Record<Channel, string> = {
	email: "Email",
	push: "Push (stub)",
};

function formatDate(value: string | null): string {
	if (!value) {
		return "—";
	}

	const date = new Date(value);

	return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-ES");
}

export function PlatformCommunicationsPanel(): ReactElement {
	const [channel, setChannel] = useState<Channel>("email");
	const [audienceType, setAudienceType] = useState<AudienceType>("all_owners");
	const [tenantId, setTenantId] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [tenants, setTenants] = useState<TenantOption[]>([]);
	const [preview, setPreview] = useState<PlatformBroadcastPreviewResponse | null>(null);
	const [history, setHistory] = useState<PlatformBroadcastResponse[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const loadHistory = useCallback(async (): Promise<void> => {
		setLoadingHistory(true);

		try {
			const response = await fetch("/api/platform/communications/broadcasts?limit=20", {
				credentials: "include",
			});

			if (!response.ok) {
				setHistory([]);

				return;
			}

			const data = (await response.json()) as BroadcastsListResponse;
			setHistory(data.broadcasts ?? []);
		} catch {
			setHistory([]);
		} finally {
			setLoadingHistory(false);
		}
	}, []);

	useEffect(() => {
		void loadHistory();
	}, [loadHistory]);

	useEffect(() => {
		async function loadTenants(): Promise<void> {
			try {
				const response = await fetch("/api/platform/tenants", { credentials: "include" });

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as {
					tenants?: { id?: string; name?: string; slug?: string }[];
				};

				setTenants(
					(data.tenants ?? [])
						.filter((tenant): tenant is TenantOption => Boolean(tenant.id && tenant.name && tenant.slug))
						.map((tenant) => ({
							id: tenant.id,
							name: tenant.name,
							slug: tenant.slug,
						})),
				);
			} catch {
				setTenants([]);
			}
		}

		void loadTenants();
	}, []);

	function buildPayload(confirmed: boolean): Record<string, unknown> {
		return {
			channel,
			audienceType,
			tenantId: audienceType === "tenant" ? tenantId : undefined,
			subject,
			body,
			confirmed,
		};
	}

	function resetPreview(): void {
		setPreview(null);
		setSuccess(null);
	}

	async function handlePreview(event: FormEvent): Promise<void> {
		event.preventDefault();
		setSubmitting(true);
		setError(null);
		setSuccess(null);
		setPreview(null);

		try {
			const response = await fetch("/api/platform/communications/broadcasts", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildPayload(false)),
			});
			const data = (await response.json()) as PlatformBroadcastPreviewResponse & {
				error?: { description?: string };
			};

			if (!response.ok) {
				setError(data.error?.description ?? "No se pudo generar la vista previa");

				return;
			}

			setPreview(data);
		} catch {
			setError("No se pudo conectar con el servidor");
		} finally {
			setSubmitting(false);
		}
	}

	async function handleConfirmSend(): Promise<void> {
		setSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/platform/communications/broadcasts", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildPayload(true)),
			});
			const data = (await response.json()) as {
				broadcast?: PlatformBroadcastResponse;
				error?: { description?: string };
			};

			if (!response.ok) {
				setError(data.error?.description ?? "No se pudo enviar el aviso");

				return;
			}

			setSuccess(
				`Aviso enviado a ${data.broadcast?.recipientCount ?? 0} destinatarios (${data.broadcast?.status ?? "sent"}).`,
			);
			setPreview(null);
			setSubject("");
			setBody("");
			await loadHistory();
		} catch {
			setError("No se pudo conectar con el servidor");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<form className="flex flex-col gap-4" onSubmit={handlePreview}>
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Canal">
							<select
								className={SELECT_CLASS}
								value={channel}
								onChange={(event) => {
									setChannel(event.target.value as Channel);
									resetPreview();
								}}
							>
								<option value="email">{CHANNEL_LABELS.email}</option>
								<option value="push">{CHANNEL_LABELS.push}</option>
							</select>
							{channel === "push" ? (
								<p className="mt-1 text-xs text-muted">Stub — solo log en dev, sin FCM/APNs.</p>
							) : null}
						</Field>
						<Field label="Audiencia">
							<select
								className={SELECT_CLASS}
								value={audienceType}
								onChange={(event) => {
									setAudienceType(event.target.value as AudienceType);
									resetPreview();
								}}
							>
								<option value="all_owners">{AUDIENCE_LABELS.all_owners}</option>
								<option value="all_app_users">{AUDIENCE_LABELS.all_app_users}</option>
								<option value="tenant">{AUDIENCE_LABELS.tenant}</option>
							</select>
						</Field>
					</div>

					{audienceType === "tenant" ? (
						<Field label="Negocio">
							<select
								className={SELECT_CLASS}
								value={tenantId}
								required
								onChange={(event) => {
									setTenantId(event.target.value);
									resetPreview();
								}}
							>
								<option value="">Selecciona un negocio</option>
								{tenants.map((tenant) => (
									<option key={tenant.id} value={tenant.id}>
										{tenant.name} ({tenant.slug})
									</option>
								))}
							</select>
						</Field>
					) : null}

					<Field label="Asunto">
						<Input
							value={subject}
							required
							onChange={(event) => {
								setSubject(event.target.value);
								resetPreview();
							}}
							placeholder="Aviso de mantenimiento programado"
						/>
					</Field>

					<Field label="Mensaje">
						<textarea
							className={TEXTAREA_CLASS}
							value={body}
							required
							onChange={(event) => {
								setBody(event.target.value);
								resetPreview();
							}}
							placeholder="Texto del aviso (texto plano)"
						/>
					</Field>

					{error ? <p className="text-sm text-error">{error}</p> : null}
					{success ? <p className="text-sm text-primary">{success}</p> : null}

					<div className="flex flex-wrap gap-3">
						<Button type="submit" variant="secondary" disabled={submitting}>
							Vista previa
						</Button>
						<Button
							type="button"
							variant="primary"
							disabled={submitting || !preview}
							onClick={() => void handleConfirmSend()}
						>
							Confirmar envío
						</Button>
					</div>
				</form>
			</Card>

			{preview ? (
				<Card>
					<h2 className="font-medium text-foreground">Vista previa</h2>
					<p className="mt-2 text-sm text-muted">
						Se enviará a <strong>{preview.recipientCount}</strong> destinatarios.
					</p>
					<ul className="mt-3 flex flex-col gap-2 text-sm text-foreground">
						{preview.sampleRecipients.map((recipient: PlatformBroadcastRecipientResponse) => (
							<li key={recipient.userId}>
								{recipient.name} · {recipient.email}
							</li>
						))}
					</ul>
					{preview.recipientCount > preview.sampleRecipients.length ? (
						<p className="mt-2 text-xs text-muted">
							Mostrando {preview.sampleRecipients.length} de {preview.recipientCount}.
						</p>
					) : null}
				</Card>
			) : null}

			<Card>
				<h2 className="font-medium text-foreground">Envíos recientes</h2>
				{loadingHistory ? (
					<p className="mt-2 text-sm text-muted">Cargando historial…</p>
				) : history.length === 0 ? (
					<p className="mt-2 text-sm text-muted">Aún no hay envíos registrados.</p>
				) : (
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="px-2 py-2 font-medium">Fecha</th>
									<th className="px-2 py-2 font-medium">Canal</th>
									<th className="px-2 py-2 font-medium">Audiencia</th>
									<th className="px-2 py-2 font-medium">Asunto</th>
									<th className="px-2 py-2 font-medium">Destinatarios</th>
									<th className="px-2 py-2 font-medium">Estado</th>
								</tr>
							</thead>
							<tbody>
								{history.map((row) => (
									<tr key={row.id} className="border-b border-border/60">
										<td className="px-2 py-2 text-foreground">{formatDate(row.sentAt ?? row.createdAt)}</td>
										<td className="px-2 py-2 text-foreground">{CHANNEL_LABELS[row.channel as Channel] ?? row.channel}</td>
										<td className="px-2 py-2 text-foreground">
											{AUDIENCE_LABELS[row.audienceType as AudienceType] ?? row.audienceType}
										</td>
										<td className="px-2 py-2 text-foreground">{row.subject}</td>
										<td className="px-2 py-2 text-foreground">{row.recipientCount}</td>
										<td className="px-2 py-2 text-foreground">{row.status}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</div>
	);
}
