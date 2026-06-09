"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useEffect, useMemo, useState } from "react";

import { platformFetch } from "../../../lib/platform/apiUrl";
import { BUSINESS_TYPE_OPTIONS } from "../../../contexts/tenants/owners/domain/BusinessType";
import { formatTenantHost } from "../../../lib/tenant/formatTenantHost";
import { slugifyBusinessName } from "../../../lib/tenant/slugifyBusinessName";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type CreateBusinessResponse = {
	tenant: { slug: string; name: string };
	kind: "user";
};

type BusinessDraft = {
	businessName: string;
	businessType: string;
};

const DRAFT_STORAGE_KEY = "platform-app:business-draft";

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

export function PlatformBusinessCreationForm(): ReactElement {
	const router = useRouter();
	const [businessName, setBusinessName] = useState("");
	const [businessType, setBusinessType] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

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
		setLoading(true);

		const response = await platformFetch("/api/user/businesses", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ businessName, businessType }),
		});

		setLoading(false);

		if (!response.ok) {
			const data = (await response.json()) as { error?: { description?: string; type?: string } };
			const description = data.error?.description ?? "Error al crear el negocio";
			setError(
				data.error?.type === "OwnerBusinessAlreadyExists"
					? "Ya tienes un negocio registrado con esta cuenta."
					: description,
			);

			return;
		}

		const data = (await response.json()) as CreateBusinessResponse;
		if (data.kind !== "user" || !data.tenant?.slug) {
			setError("Respuesta inválida del servidor");

			return;
		}

		sessionStorage.removeItem(DRAFT_STORAGE_KEY);
		router.push("/u/home");
		router.refresh();
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
					disabled={loading}
				/>
			</Field>
			{previewHost ? (
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
					disabled={loading}
				>
					<option value="">Selecciona un tipo</option>
					{BUSINESS_TYPE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</Field>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<Button type="submit" disabled={loading} className="w-full">
				{loading ? "Creando negocio..." : "Crear negocio"}
			</Button>
		</form>
	);
}
