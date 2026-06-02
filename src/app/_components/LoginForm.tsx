"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

import { themePresetIds, themePresetLabels } from "./theme/themePresets";
import { useTheme } from "./theme/ThemeProvider";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";

type TenantAuthPayload = {
	slug: string;
	primaryColor: string;
	secondaryColor: string;
};

type AuthResponse = {
	tenant: TenantAuthPayload;
};

type LoginFormProps = {
	/** Shown when host has no resolved tenant but APP_DOMAIN expects subdomain login. */
	hostTenantMissing?: boolean;
};

export function LoginForm({ hostTenantMissing = false }: LoginFormProps): ReactElement {
	const { applyTheme, applyPreset } = useTheme();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleAuthResponse(response: Response): Promise<TenantAuthPayload | null> {
		let data: { error?: { description?: string; type?: string }; tenant?: TenantAuthPayload };
		try {
			data = (await response.json()) as typeof data;
		} catch {
			setError("Respuesta inválida del servidor");

			return null;
		}

		if (!response.ok) {
			const description = data.error?.description ?? `Error al iniciar sesión (${response.status})`;
			setError(
				data.error?.type === "PlatformUserCannotUseTenantLogin"
					? `${description} (ruta: /platform/login en el host apex, p. ej. localhost)`
					: description,
			);

			return null;
		}

		if (!data.tenant) {
			setError("Respuesta sin datos del negocio");

			return null;
		}

		applyTheme({
			primaryColor: data.tenant.primaryColor,
			secondaryColor: data.tenant.secondaryColor,
		});

		return data.tenant;
	}

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password }),
			});

			const tenant = await handleAuthResponse(response);
			if (tenant) {
				navigateAfterAuth(tenant);
			}
		} catch {
			setError("No se pudo conectar con el servidor");
		} finally {
			setLoading(false);
		}
	}

	async function demo(): Promise<void> {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/demo", { method: "POST", credentials: "include" });
			const tenant = await handleAuthResponse(response);
			if (tenant) {
				navigateAfterAuth(tenant);
			}
		} catch {
			setError("No se pudo conectar con el servidor");
		} finally {
			setLoading(false);
		}
	}

	function isApexDevHost(hostname: string): boolean {
		return hostname === "localhost" || hostname === "127.0.0.1";
	}

	function navigateAfterAuth(tenant: TenantAuthPayload): void {
		const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
		const { protocol, port, hostname } = window.location;

		// Cookies are host-only on localhost; redirecting apex → subdomain drops the session.
		if (appDomain && tenant.slug && !isApexDevHost(hostname)) {
			const tenantHost = port
				? `${tenant.slug}.${appDomain}:${port}`
				: `${tenant.slug}.${appDomain}`;
			const alreadyOnTenantHost = hostname === `${tenant.slug}.${appDomain}`;

			if (!alreadyOnTenantHost) {
				window.location.assign(`${protocol}//${tenantHost}/home`);

				return;
			}
		}

		window.location.assign("/home");
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
			{hostTenantMissing ? (
				<p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted">
					Tras iniciar sesión en localhost serás redirigido al subdominio de tu negocio si{" "}
					<code className="text-xs">NEXT_PUBLIC_APP_DOMAIN</code> está configurado. También puedes
					abrir directamente <code className="text-xs">tu-slug.localhost</code>/login.
				</p>
			) : null}
			<Field label="Email">
				<Input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					autoComplete="email"
				/>
			</Field>
			<Field label="Contraseña">
				<Input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					autoComplete="current-password"
				/>
			</Field>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<Button type="submit" disabled={loading} className="w-full">
				{loading ? "Entrando..." : "Entrar"}
			</Button>
			<Button
				type="button"
				variant="secondary"
				disabled={loading}
				className="w-full"
				onClick={() => void demo()}
			>
				Entrar como demo
			</Button>
			{process.env.NODE_ENV === "development" ? (
				<div className="flex flex-col gap-2 border-t border-border pt-4">
					<p className="text-center text-xs text-muted">Presets (solo dev)</p>
					<div className="flex flex-col gap-2">
						{themePresetIds.map((presetId) => (
							<Button
								key={presetId}
								type="button"
								variant="ghost"
								disabled={loading}
								className="w-full text-xs"
								onClick={() => applyPreset(presetId)}
							>
								{themePresetLabels[presetId]}
							</Button>
						))}
					</div>
				</div>
			) : null}
			<p className="text-center text-sm text-muted">
				¿Sin cuenta?{" "}
				<Link href="/register" className="text-primary underline-offset-2 hover:underline">
					Regístrate
				</Link>
			</p>
		</form>
	);
}
