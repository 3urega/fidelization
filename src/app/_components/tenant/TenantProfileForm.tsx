"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import type { TenantGeocodingStatus } from "../../../contexts/tenants/tenants/domain/TenantGeocodingStatus";
import { type TenantDiscoveryTagId } from "../../../contexts/tenants/tenants/domain/TenantDiscoveryTag";
import {
	deriveTenantGeocodingDisplayState,
	displayStateFromPatchResponse,
	type TenantGeocodingDisplayState,
} from "../../../lib/tenant/deriveTenantGeocodingDisplayState";
import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { TenantCoverImageUpload } from "./TenantCoverImageUpload";
import { TenantDiscoveryTagsPicker } from "./TenantDiscoveryTagsPicker";
import { TenantGeocodingMapPreview } from "./TenantGeocodingMapPreview";
import { TenantGeocodingStatusBanner } from "./TenantGeocodingStatusBanner";

type ProfilePatchResponse = {
	tenant?: {
		address: string;
		description: string;
		discoveryTags?: TenantDiscoveryTagId[];
		latitude?: number | null;
		longitude?: number | null;
		geocodedAt?: string | null;
	};
	geocodingStatus?: TenantGeocodingStatus;
	geocodingMessage?: string;
	error?: {
		type?: string;
		description?: string;
	};
};

export function TenantProfileForm(): ReactElement {
	const { session, loading, error, refresh } = useTenantSession();
	const [address, setAddress] = useState("");
	const [description, setDescription] = useState("");
	const [discoveryTags, setDiscoveryTags] = useState<TenantDiscoveryTagId[]>([]);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [addressHint, setAddressHint] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [regeocoding, setRegeocoding] = useState(false);
	const [geocodingDisplay, setGeocodingDisplay] = useState<TenantGeocodingDisplayState>({
		variant: "none",
	});

	const syncGeocodingFromSession = useCallback((): void => {
		if (!session) {
			setGeocodingDisplay({ variant: "none" });
			return;
		}

		setGeocodingDisplay(
			deriveTenantGeocodingDisplayState({
				address: session.tenant.address,
				latitude: session.tenant.latitude ?? null,
				longitude: session.tenant.longitude ?? null,
				geocodedAt: session.tenant.geocodedAt ?? null,
			}),
		);
	}, [session]);

	useEffect(() => {
		if (!session) {
			return;
		}

		setAddress(session.tenant.address ?? "");
		setDescription(session.tenant.description ?? "");
		setDiscoveryTags((session.tenant.discoveryTags ?? []) as TenantDiscoveryTagId[]);
		syncGeocodingFromSession();
	}, [session, syncGeocodingFromSession]);

	const applyProfileUpdateResponse = useCallback(
		(body: ProfilePatchResponse): void => {
			if (!body.geocodingStatus) {
				return;
			}

			const nextDisplay = displayStateFromPatchResponse(
				body.geocodingStatus,
				body.geocodingMessage,
			);

			if (nextDisplay) {
				setGeocodingDisplay(nextDisplay);
			}
		},
		[],
	);

	const handleRegeocode = useCallback(async (): Promise<void> => {
		setSubmitError(null);
		setSuccess(null);
		setRegeocoding(true);

		try {
			const response = await fetch("/api/tenant/profile/regeocode", {
				method: "POST",
				credentials: "include",
			});
			const body = (await response.json()) as ProfilePatchResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo reintentar la ubicación.");
				return;
			}

			applyProfileUpdateResponse(body);
			await refresh();
		} catch {
			setSubmitError("Error de red al reintentar la ubicación.");
		} finally {
			setRegeocoding(false);
		}
	}, [applyProfileUpdateResponse, refresh]);

	if (loading) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (!session) {
		return <p className="text-sm text-muted">Sesión no disponible.</p>;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setSubmitError(null);
		setSuccess(null);
		setAddressHint(null);
		setSaving(true);

		try {
			const response = await fetch("/api/tenant/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ address, description, discoveryTags }),
			});
			const body = (await response.json()) as ProfilePatchResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo guardar el perfil.");
				return;
			}

			await refresh();
			applyProfileUpdateResponse(body);

			const geocodingStatus = body.geocodingStatus;

			if (!address.trim()) {
				setAddressHint(
					"Perfil guardado. Recomendamos añadir la dirección para que los clientes te encuentren.",
				);
				setGeocodingDisplay({ variant: "none" });
				return;
			}

			if (geocodingStatus === "failed") {
				setSuccess(null);
				return;
			}

			if (geocodingStatus === "skipped") {
				setSuccess("Datos del negocio guardados correctamente.");
				return;
			}

			if (geocodingStatus === "ok" || geocodingStatus === "cleared") {
				setSuccess("Datos del negocio guardados correctamente.");
				return;
			}

			setSuccess("Datos del negocio guardados correctamente.");
		} catch {
			setSubmitError("Error de red al guardar los datos.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<TenantCoverImageUpload />
			</Card>

			<Card>
				<form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
					<Field label="Tags del local">
						<TenantDiscoveryTagsPicker value={discoveryTags} onChange={setDiscoveryTags} />
					</Field>

					<Field label="Descripción">
						<textarea
							name="description"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Cuénta a tus clientes qué ofrece tu negocio…"
							rows={4}
							className="w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						/>
						<p className="mt-1 text-xs text-muted">Opcional. Visible en el detalle del local.</p>
					</Field>

					<Field label="Dirección">
						<Input
							type="text"
							name="address"
							value={address}
							onChange={(event) => setAddress(event.target.value)}
							placeholder="Calle, número, ciudad…"
							autoComplete="street-address"
						/>
						<p className="mt-1 text-xs text-muted">
							Opcional. Recomendamos añadir la dirección para que los clientes te encuentren.
						</p>
					</Field>

					<TenantGeocodingStatusBanner
						state={geocodingDisplay}
						onRetry={() => void handleRegeocode()}
						retrying={regeocoding}
					/>

					<TenantGeocodingMapPreview
						latitude={session.tenant.latitude ?? null}
						longitude={session.tenant.longitude ?? null}
					/>

					{addressHint ? (
						<p className="rounded-theme border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
							{addressHint}
						</p>
					) : null}
					{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
					{success ? <p className="text-sm text-foreground">{success}</p> : null}

					<Button type="submit" disabled={saving || regeocoding} className="w-full sm:w-auto">
						{saving ? "Guardando…" : "Guardar datos"}
					</Button>
				</form>
			</Card>
		</div>
	);
}
