"use client";

import { type ReactElement, useState } from "react";

import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";

export function PlatformLoginForm(): ReactElement {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password }),
			});

			let data: { error?: { description?: string; message?: string } } = {};
			try {
				data = (await response.json()) as typeof data;
			} catch {
				if (!response.ok) {
					setError(`Error al iniciar sesión de plataforma (${response.status})`);

					return;
				}
			}

			if (!response.ok) {
				setError(
					data.error?.description ??
						data.error?.message ??
						`Error al iniciar sesión de plataforma (${response.status})`,
				);

				return;
			}

			window.location.assign("/platform");
		} catch {
			setError("No se pudo conectar con el servidor");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
			<p className="text-sm text-muted">
				Acceso restringido a operadores de la plataforma. Sin registro público. Usa el host apex (
				<code className="text-xs">localhost</code>, no un subdominio de negocio). Si tenías sesión
				de negocio (owner), al entrar aquí se sustituye por la sesión de plataforma.
			</p>
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
				{loading ? "Entrando..." : "Entrar como superadmin"}
			</Button>
		</form>
	);
}
