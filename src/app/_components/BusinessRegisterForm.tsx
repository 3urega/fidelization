"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";

type RegisterBusinessResponse = {
	user: { id: string; name: string; email: string };
	intendedRole: string;
};

const MIN_PASSWORD_LENGTH = 8;
const WIZARD_STORAGE_KEY = "onboarding:wizard";

export function BusinessRegisterForm(): ReactElement {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError("Las contraseñas no coinciden");

			return;
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);

			return;
		}

		setLoading(true);

		const response = await fetch("/api/auth/register/business", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ name, email, password, confirmPassword }),
		});

		setLoading(false);

		if (!response.ok) {
			const data = (await response.json()) as { error?: { description?: string } };
			setError(data.error?.description ?? "Error al registrarse");

			return;
		}

		const data = (await response.json()) as RegisterBusinessResponse;
		sessionStorage.setItem(
			WIZARD_STORAGE_KEY,
			JSON.stringify({ step: 2, email: data.user.email, userId: data.user.id }),
		);
		router.push("/register/business/tenant");
		router.refresh();
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
			<p className="text-xs font-medium uppercase tracking-wide text-muted">Paso 1 de 2</p>
			<Field label="Tu nombre">
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					autoComplete="name"
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
					minLength={MIN_PASSWORD_LENGTH}
					autoComplete="new-password"
				/>
			</Field>
			<Field label="Confirmar contraseña">
				<Input
					type="password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					required
					minLength={MIN_PASSWORD_LENGTH}
					autoComplete="new-password"
				/>
			</Field>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<Button type="submit" disabled={loading} className="w-full">
				{loading ? "Creando cuenta..." : "Continuar"}
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
