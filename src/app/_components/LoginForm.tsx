"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

import { themePresetIds, themePresetLabels } from "./theme/themePresets";
import { useTheme } from "./theme/ThemeProvider";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";

type AuthResponse = {
	tenant: {
		primaryColor: string;
		secondaryColor: string;
	};
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

	async function handleAuthResponse(response: Response): Promise<boolean> {
		if (!response.ok) {
			const data = (await response.json()) as {
				error?: { description?: string; type?: string };
			};
			setError(data.error?.description ?? "Error al iniciar sesión");

			return false;
		}

		const data = (await response.json()) as AuthResponse;
		applyTheme({
			primaryColor: data.tenant.primaryColor,
			secondaryColor: data.tenant.secondaryColor,
		});

		return true;
	}

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ email, password }),
		});

		setLoading(false);

		if (await handleAuthResponse(response)) {
			navigateAfterAuth();
		}
	}

	async function demo(): Promise<void> {
		setLoading(true);
		setError(null);

		const response = await fetch("/api/auth/demo", { method: "POST", credentials: "include" });

		setLoading(false);

		if (await handleAuthResponse(response)) {
			navigateAfterAuth();
		}
	}

	function navigateAfterAuth(): void {
		// Full navigation so middleware receives the new httpOnly session cookie.
		window.location.assign("/home");
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
			{hostTenantMissing ? (
				<p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted">
					Usa la URL de tu negocio (por ejemplo <code className="text-xs">cafe-demo.localhost</code>) para
					iniciar sesión en ese local.
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
