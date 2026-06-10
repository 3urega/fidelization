"use client";

import { type ReactElement, useEffect, useState } from "react";

import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type ProfilePatchResponse = {
	tenant?: {
		address: string;
		description: string;
	};
	error?: {
		type?: string;
		description?: string;
	};
};

export function TenantProfileForm(): ReactElement {
	const { session, loading, error, refresh } = useTenantSession();
	const [address, setAddress] = useState("");
	const [description, setDescription] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [addressHint, setAddressHint] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!session) {
			return;
		}

		setAddress(session.tenant.address ?? "");
		setDescription(session.tenant.description ?? "");
	}, [session]);

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
				body: JSON.stringify({ address, description }),
			});
			const body = (await response.json()) as ProfilePatchResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo guardar el perfil.");
				return;
			}

			await refresh();

			if (!address.trim()) {
				setAddressHint(
					"Perfil guardado. Recomendamos añadir la dirección para que los clientes te encuentren.",
				);
			} else {
				setSuccess("Datos del negocio guardados correctamente.");
			}
		} catch {
			setSubmitError("Error de red al guardar los datos.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card>
			<form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
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

				{addressHint ? (
					<p className="rounded-theme border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
						{addressHint}
					</p>
				) : null}
				{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
				{success ? <p className="text-sm text-foreground">{success}</p> : null}

				<Button type="submit" disabled={saving} className="w-full sm:w-auto">
					{saving ? "Guardando…" : "Guardar datos"}
				</Button>
			</form>
		</Card>
	);
}
