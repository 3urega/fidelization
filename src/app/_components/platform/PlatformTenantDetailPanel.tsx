"use client";

import Link from "next/link";
import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

import type { PlatformTenantDetailResponse } from "../../../lib/platform/tenant-detail";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

type PlatformTenantDetailPanelProps = {
	tenantId: string;
};

function formatCreatedAt(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return iso;
	}

	return date.toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

export function PlatformTenantDetailPanel({ tenantId }: PlatformTenantDetailPanelProps): ReactElement {
	const [detail, setDetail] = useState<PlatformTenantDetailResponse | null>(null);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [planId, setPlanId] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [togglingStatus, setTogglingStatus] = useState(false);
	const [impersonating, setImpersonating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [savedMessage, setSavedMessage] = useState<string | null>(null);

	const applyDetail = useCallback((data: PlatformTenantDetailResponse): void => {
		setDetail(data);
		setName(data.tenant.name);
		setSlug(data.tenant.slug);
		setPlanId(data.tenant.subscriptionPlanId ?? data.availablePlans[0]?.id ?? "");
	}, []);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/platform/tenants/${tenantId}`, { credentials: "include" });
			if (!response.ok) {
				setError("No se pudo cargar el detalle del negocio");
				setDetail(null);

				return;
			}

			const data = (await response.json()) as PlatformTenantDetailResponse;
			applyDetail(data);
		} catch {
			setError("No se pudo conectar con el servidor");
			setDetail(null);
		} finally {
			setLoading(false);
		}
	}, [applyDetail, tenantId]);

	useEffect(() => {
		void load();
	}, [load]);

	async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setSaving(true);
		setActionError(null);
		setSavedMessage(null);

		try {
			const response = await fetch(`/api/platform/tenants/${tenantId}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, slug, planId }),
			});
			const data = (await response.json()) as PlatformTenantDetailResponse & {
				error?: { description?: string };
			};

			if (!response.ok) {
				setActionError(data.error?.description ?? `Error al guardar (${response.status})`);

				return;
			}

			applyDetail(data);
			setSavedMessage("Cambios guardados");
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setSaving(false);
		}
	}

	async function impersonateTenant(): Promise<void> {
		setImpersonating(true);
		setActionError(null);
		setSavedMessage(null);

		try {
			const response = await fetch(`/api/platform/tenants/${tenantId}/impersonate`, {
				method: "POST",
				credentials: "include",
			});
			const data = (await response.json()) as {
				redirectUrl?: string;
				error?: { description?: string };
			};

			if (!response.ok) {
				setActionError(data.error?.description ?? `Error al entrar (${response.status})`);

				return;
			}

			window.location.assign(data.redirectUrl ?? "/panel");
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setImpersonating(false);
		}
	}

	async function toggleStatus(): Promise<void> {
		if (!detail) {
			return;
		}

		const nextStatus = detail.tenant.status === "active" ? "suspended" : "active";
		setTogglingStatus(true);
		setActionError(null);
		setSavedMessage(null);

		try {
			const response = await fetch(`/api/platform/tenants/${tenantId}/status`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: nextStatus }),
			});

			if (!response.ok) {
				const data = (await response.json()) as { error?: { description?: string } };
				setActionError(data.error?.description ?? `Error al actualizar estado (${response.status})`);

				return;
			}

			await load();
			setSavedMessage(nextStatus === "active" ? "Negocio reactivado" : "Negocio suspendido");
		} catch {
			setActionError("No se pudo conectar con el servidor");
		} finally {
			setTogglingStatus(false);
		}
	}

	if (loading) {
		return <p className="text-sm text-muted">Cargando detalle…</p>;
	}

	if (error || !detail) {
		return <p className="text-sm text-error">{error ?? "Negocio no encontrado"}</p>;
	}

	const isActive = detail.tenant.status === "active";

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<Link href="/platform/tenants" className="font-medium text-primary hover:opacity-80">
					Negocios
				</Link>
				<span className="text-muted">/</span>
				<span className="text-foreground">{detail.tenant.name}</span>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<p className="text-xs text-muted">Clientes</p>
					<p className="mt-1 text-2xl font-semibold text-foreground">
						{detail.activity.customersCount}
					</p>
				</Card>
				<Card>
					<p className="text-xs text-muted">Equipo</p>
					<p className="mt-1 text-2xl font-semibold text-foreground">{detail.activity.staffCount}</p>
				</Card>
				<Card>
					<p className="text-xs text-muted">Escaneos QR</p>
					<p className="mt-1 text-2xl font-semibold text-foreground">
						{detail.activity.qrScansCount}
					</p>
				</Card>
			</div>

			<Card>
				<h2 className="font-medium text-foreground">Datos del negocio</h2>
				<p className="mt-1 text-sm text-muted">
					Alta {formatCreatedAt(detail.tenant.createdAt)} · Estado{" "}
					{isActive ? "activo" : "suspendido"}
				</p>

				<form className="mt-4 flex flex-col gap-4" onSubmit={(event) => void handleSave(event)}>
					<label className="flex flex-col gap-1 text-sm">
						<span className="text-muted">Nombre</span>
						<Input value={name} onChange={(event) => setName(event.target.value)} required />
					</label>

					<label className="flex flex-col gap-1 text-sm">
						<span className="text-muted">Slug</span>
						<Input value={slug} onChange={(event) => setSlug(event.target.value)} required />
					</label>

					<label className="flex flex-col gap-1 text-sm">
						<span className="text-muted">Plan</span>
						<select
							className="block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
							value={planId}
							onChange={(event) => setPlanId(event.target.value)}
						>
							{detail.availablePlans.map((plan) => (
								<option key={plan.id} value={plan.id}>
									{plan.name}
									{plan.priceMonthly > 0 ? ` · ${(plan.priceMonthly / 100).toFixed(0)} €/mes` : " · gratis"}
								</option>
							))}
						</select>
					</label>

					<p className="text-sm">
						<Link
							href={`/platform/features?tenant=${encodeURIComponent(detail.tenant.slug)}`}
							className="text-primary underline-offset-2 hover:underline"
						>
							Editar feature flags de este negocio
						</Link>
					</p>

					<div className="flex flex-wrap gap-2">
						<Button type="submit" disabled={saving || togglingStatus || impersonating}>
							{saving ? "Guardando…" : "Guardar cambios"}
						</Button>
						<Button
							type="button"
							variant="secondary"
							disabled={saving || togglingStatus || impersonating}
							onClick={() => void impersonateTenant()}
						>
							{impersonating ? "Entrando…" : "Entrar como comercio"}
						</Button>
						<Button
							type="button"
							variant="secondary"
							disabled={saving || togglingStatus || impersonating}
							onClick={() => void toggleStatus()}
						>
							{togglingStatus ? "Actualizando…" : isActive ? "Suspender" : "Reactivar"}
						</Button>
					</div>

					{actionError ? <p className="text-sm text-error">{actionError}</p> : null}
					{savedMessage ? <p className="text-sm text-foreground">{savedMessage}</p> : null}
				</form>
			</Card>

			<section aria-labelledby="owners-heading" className="flex flex-col gap-3">
				<h2 id="owners-heading" className="text-sm font-medium text-foreground">
					Propietarios
				</h2>

				{detail.owners.length === 0 ? (
					<Card>
						<p className="text-sm text-muted">Sin propietarios registrados.</p>
					</Card>
				) : (
					<ul className="flex flex-col gap-2">
						{detail.owners.map((owner) => (
							<li key={owner.userId}>
								<Card>
									<p className="font-medium text-foreground">{owner.name}</p>
									<p className="text-sm text-muted">{owner.email}</p>
								</Card>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
