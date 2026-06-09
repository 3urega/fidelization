"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { platformFetch } from "../../../lib/platform/apiUrl";
import { platformRoutes } from "../../../lib/platform/routes";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { PlatformAuthDivider } from "./PlatformAuthDivider";
import { PlatformGoogleSignInButton } from "./PlatformGoogleSignInButton";

type UserAuthResponse = {
	user: { id: string; name: string; email: string };
	kind: "user";
};

function mapLoginError(description: string, type?: string): string {
	if (type === "InvalidCredentials") {
		return "Email o contraseña incorrectos";
	}

	if (type === "PlatformUserCannotUseUserLogin") {
		return "Esta cuenta no puede usar el login de la app. Usa el panel de plataforma.";
	}

	return description;
}

type PlatformUserLoginFormProps = {
	redirectTo?: string;
};

export function PlatformUserLoginForm({
	redirectTo = platformRoutes.home,
}: PlatformUserLoginFormProps): ReactElement {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function submit(e: React.FormEvent): Promise<void> {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const response = await platformFetch("/api/auth/login/user", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ email, password }),
		});

		setLoading(false);

		if (!response.ok) {
			const data = (await response.json()) as {
				error?: { description?: string; type?: string };
			};
			setError(
				mapLoginError(data.error?.description ?? "Error al iniciar sesión", data.error?.type),
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
		<div className="flex flex-col gap-4">
			<PlatformGoogleSignInButton redirectTo={redirectTo} text="signin_with" />
			<PlatformAuthDivider />
			<form className="flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
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
				{loading ? "Entrando..." : "Iniciar sesión"}
			</Button>
			<p className="text-center text-sm text-muted">
				¿No tienes cuenta?{" "}
				<Link href={platformRoutes.register} className="font-medium text-primary hover:opacity-80">
					Regístrate
				</Link>
			</p>
			</form>
		</div>
	);
}
