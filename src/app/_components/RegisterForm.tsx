"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

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

export function RegisterForm(): ReactElement {
	const { applyTheme } = useTheme();
	const [name, setName] = useState("");
	const [businessName, setBusinessName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const response = await fetch("/api/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ name, businessName, email, password }),
		});

		setLoading(false);

		if (!response.ok) {
			const data = (await response.json()) as { error?: { description?: string } };
			setError(data.error?.description ?? "Error al registrarse");

			return;
		}

		const data = (await response.json()) as AuthResponse;
		applyTheme({
			primaryColor: data.tenant.primaryColor,
			secondaryColor: data.tenant.secondaryColor,
		});
		window.location.assign("/panel");
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
			<Field label="Tu nombre">
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					autoComplete="name"
				/>
			</Field>
			<Field label="Nombre del negocio">
				<Input
					value={businessName}
					onChange={(e) => setBusinessName(e.target.value)}
					required
					autoComplete="organization"
				/>
			</Field>
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
					minLength={8}
					autoComplete="new-password"
				/>
			</Field>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<Button type="submit" disabled={loading} className="w-full">
				{loading ? "Creando cuenta..." : "Crear cuenta"}
			</Button>
			<p className="text-center text-sm text-muted">
				¿Ya tienes cuenta?{" "}
				<Link href="/login" className="text-primary underline-offset-2 hover:underline">
					Inicia sesión
				</Link>
			</p>
		</form>
	);
}
