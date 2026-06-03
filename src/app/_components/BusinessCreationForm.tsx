"use client";

import { type ReactElement, useEffect, useMemo, useState } from "react";

import { BUSINESS_TYPE_OPTIONS } from "../../contexts/tenants/owners/domain/BusinessType";
import { formatTenantHost } from "../../lib/tenant/formatTenantHost";
import { slugifyBusinessName } from "../../lib/tenant/slugifyBusinessName";
import { useTheme } from "./theme/ThemeProvider";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";

type CreateBusinessResponse = {
	tenant: {
		primaryColor: string;
		secondaryColor: string;
		slug: string;
		name: string;
	};
};

type BusinessDraft = {
	businessName: string;
	businessType: string;
};

const DRAFT_STORAGE_KEY = "onboarding:business-draft";
const REDIRECT_DELAY_MS = 2500;

function loadDraft(): BusinessDraft {
	if (typeof window === "undefined") {
		return { businessName: "", businessType: "" };
	}

	try {
		const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
		if (!raw) {
			return { businessName: "", businessType: "" };
		}

		const parsed = JSON.parse(raw) as Partial<BusinessDraft>;

		return {
			businessName: parsed.businessName ?? "",
			businessType: parsed.businessType ?? "",
		};
	} catch {
		return { businessName: "", businessType: "" };
	}
}

function saveDraft(draft: BusinessDraft): void {
	sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function clientTenantHost(slug: string): string | null {
	const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
	if (!appDomain || typeof window === "undefined") {
		return null;
	}

	return formatTenantHost({
		slug,
		appDomain,
		port: window.location.port || undefined,
	});
}

export function BusinessCreationForm(): ReactElement {
	const { applyTheme } = useTheme();
	const [businessName, setBusinessName] = useState("");
	const [businessType, setBusinessType] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [createdHost, setCreatedHost] = useState<string | null>(null);

	const previewHost = useMemo(() => {
		if (!businessName.trim()) {
			return null;
		}

		return clientTenantHost(slugifyBusinessName(businessName));
	}, [businessName]);

	useEffect(() => {
		const draft = loadDraft();
		setBusinessName(draft.businessName);
		setBusinessType(draft.businessType);
	}, []);

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setError(null);
		setCreatedHost(null);
		setLoading(true);

		const response = await fetch("/api/auth/register/business/tenant", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ businessName, businessType }),
		});

		setLoading(false);

		if (!response.ok) {
			const data = (await response.json()) as { error?: { description?: string } };
			setError(data.error?.description ?? "Error al crear el negocio");

			return;
		}

		const data = (await response.json()) as CreateBusinessResponse;
		sessionStorage.removeItem("onboarding:wizard");
		sessionStorage.removeItem(DRAFT_STORAGE_KEY);
		applyTheme({
			primaryColor: data.tenant.primaryColor,
			secondaryColor: data.tenant.secondaryColor,
		});

		const finalHost = clientTenantHost(data.tenant.slug);
		if (finalHost) {
			setCreatedHost(finalHost);
			window.setTimeout(() => {
				window.location.assign("/home");
			}, REDIRECT_DELAY_MS);

			return;
		}

		window.location.assign("/home");
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
			<p className="text-xs font-medium uppercase tracking-wide text-muted">Paso 2 de 2</p>
			<Field label="Nombre del negocio">
				<Input
					value={businessName}
					onChange={(e) => {
						const value = e.target.value;
						setBusinessName(value);
						saveDraft({ businessName: value, businessType });
					}}
					required
					autoComplete="organization"
					disabled={loading || createdHost !== null}
				/>
			</Field>
			{previewHost && !createdHost ? (
				<div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted">
					<p>
						Tu enlace será:{" "}
						<code className="text-xs text-foreground">{previewHost}</code>
					</p>
					<p className="mt-1 text-xs">
						Si el nombre ya está en uso, el enlace puede incluir un sufijo adicional.
					</p>
				</div>
			) : null}
			<Field label="Tipo de negocio">
				<select
					className="block w-full rounded-theme border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
					value={businessType}
					onChange={(e) => {
						const value = e.target.value;
						setBusinessType(value);
						saveDraft({ businessName, businessType: value });
					}}
					required
					disabled={loading || createdHost !== null}
				>
					<option value="">Selecciona un tipo</option>
					{BUSINESS_TYPE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</Field>
			{createdHost ? (
				<p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
					Negocio creado. Tu enlace: <code className="text-xs">{createdHost}</code>. Redirigiendo al
					panel…
				</p>
			) : null}
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<Button type="submit" disabled={loading || createdHost !== null} className="w-full">
				{loading ? "Creando negocio..." : "Crear negocio e ir al panel"}
			</Button>
		</form>
	);
}
