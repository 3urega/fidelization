"use client";

import { type ReactElement, useEffect, useState } from "react";

import { isBrandingHexColor } from "../../../contexts/tenants/tenants/domain/BrandingColor";
import { useTheme } from "../theme/ThemeProvider";
import { useTenantSession } from "../shell/TenantSessionProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type BrandingPatchResponse = {
	tenant?: {
		logoUrl: string;
		primaryColor: string;
		secondaryColor: string;
	};
	error?: {
		type?: string;
		description?: string;
	};
};

function normalizeHexInput(value: string): string {
	const trimmed = value.trim();
	if (!trimmed.startsWith("#")) {
		return `#${trimmed}`;
	}

	return trimmed;
}

export function TenantBrandingForm(): ReactElement {
	const { session, loading, error, refresh } = useTenantSession();
	const { applyTheme } = useTheme();
	const [logoUrl, setLogoUrl] = useState("");
	const [primaryColor, setPrimaryColor] = useState("#7C3AED");
	const [secondaryColor, setSecondaryColor] = useState("#4F46E5");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!session) {
			return;
		}

		setLogoUrl(session.tenant.logoUrl);
		setPrimaryColor(session.tenant.primaryColor);
		setSecondaryColor(session.tenant.secondaryColor);
	}, [session]);

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
					Solo el propietario del negocio puede editar el branding.
				</p>
			</Card>
		);
	}

	const primaryValid = isBrandingHexColor(primaryColor);
	const secondaryValid = isBrandingHexColor(secondaryColor);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setSubmitError(null);
		setSuccess(null);

		if (!primaryValid || !secondaryValid) {
			setSubmitError("Los colores deben ser hex de 6 dígitos (#RRGGBB).");

			return;
		}

		setSaving(true);

		try {
			const response = await fetch("/api/tenant/branding", {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					logoUrl: logoUrl.trim(),
					primaryColor,
					secondaryColor,
				}),
			});

			const body = (await response.json()) as BrandingPatchResponse;

			if (!response.ok) {
				setSubmitError(body.error?.description ?? "No se pudo guardar el branding.");

				return;
			}

			if (body.tenant) {
				applyTheme({
					primaryColor: body.tenant.primaryColor,
					secondaryColor: body.tenant.secondaryColor,
				});
			}

			await refresh();
			setSuccess("Branding guardado correctamente.");
		} catch {
			setSubmitError("Error de red al guardar el branding.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card>
			<form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
				<Field label="URL del logo">
					<Input
						type="url"
						name="logoUrl"
						value={logoUrl}
						onChange={(event) => setLogoUrl(event.target.value)}
						placeholder="https://ejemplo.com/logo.png"
						autoComplete="off"
					/>
					<p className="mt-1 text-xs text-muted">Opcional. Déjalo vacío para usar la inicial del negocio.</p>
				</Field>

				<Field label="Color primario">
					<div className="flex flex-wrap items-center gap-3">
						<Input
							type="color"
							name="primaryColorPicker"
							value={primaryValid ? primaryColor : "#7C3AED"}
							onChange={(event) => setPrimaryColor(event.target.value)}
							className="h-10 w-14 cursor-pointer p-1"
							aria-label="Selector color primario"
						/>
						<Input
							type="text"
							name="primaryColor"
							value={primaryColor}
							onChange={(event) => setPrimaryColor(normalizeHexInput(event.target.value))}
							placeholder="#7C3AED"
							spellCheck={false}
							className="max-w-[8rem] font-mono"
						/>
					</div>
					{!primaryValid ? (
						<p className="mt-1 text-xs text-error">Formato inválido. Usa #RRGGBB.</p>
					) : null}
				</Field>

				<Field label="Color secundario">
					<div className="flex flex-wrap items-center gap-3">
						<Input
							type="color"
							name="secondaryColorPicker"
							value={secondaryValid ? secondaryColor : "#4F46E5"}
							onChange={(event) => setSecondaryColor(event.target.value)}
							className="h-10 w-14 cursor-pointer p-1"
							aria-label="Selector color secundario"
						/>
						<Input
							type="text"
							name="secondaryColor"
							value={secondaryColor}
							onChange={(event) => setSecondaryColor(normalizeHexInput(event.target.value))}
							placeholder="#4F46E5"
							spellCheck={false}
							className="max-w-[8rem] font-mono"
						/>
					</div>
					{!secondaryValid ? (
						<p className="mt-1 text-xs text-error">Formato inválido. Usa #RRGGBB.</p>
					) : null}
				</Field>

				{submitError ? <p className="text-sm text-error">{submitError}</p> : null}
				{success ? <p className="text-sm text-foreground">{success}</p> : null}

				<Button type="submit" disabled={saving || !primaryValid || !secondaryValid} className="w-full sm:w-auto">
					{saving ? "Guardando…" : "Guardar branding"}
				</Button>
			</form>
		</Card>
	);
}
