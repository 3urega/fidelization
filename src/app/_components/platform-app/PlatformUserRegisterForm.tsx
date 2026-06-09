"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";

type UserAuthResponse = {
	user: { id: string; name: string; email: string };
	kind: "user";
};

const MIN_PASSWORD_LENGTH = 8;

function mapRegisterError(description: string, type?: string): string {
	if (type === "EmailAlreadyRegistered") {
		return "Este email ya está registrado. ¿Quieres iniciar sesión?";
	}

	return description;
}

type PlatformUserRegisterFormProps = {
	redirectTo?: string;
};

export function PlatformUserRegisterForm({
	redirectTo = "/u/home",
}: PlatformUserRegisterFormProps): ReactElement {
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

		const response = await fetch("/api/auth/register/user", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ name, email, password }),
		});

		setLoading(false);

		if (!response.ok) {
			const data = (await response.json()) as {
				error?: { description?: string; type?: string };
			};
			setError(
				mapRegisterError(
					data.error?.description ?? "Error al registrarse",
					data.error?.type,
				),
			);

			return;
		}

		const data = (await response.json()) as UserAuthResponse;
		if (data.kind !== "user" || !data.user?.id) {
			setError("Respuesta inválida del servidor");

			return;
		}

		router.push(redirectTo);
		router.refresh();
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
				{loading ? "Creando cuenta..." : "Registrarse"}
			</Button>
			<p className="text-center text-sm text-muted">
				¿Ya tienes cuenta?{" "}
				<Link href="/u/login" className="font-medium text-primary hover:opacity-80">
					Inicia sesión
				</Link>
			</p>
		</form>
	);
}
