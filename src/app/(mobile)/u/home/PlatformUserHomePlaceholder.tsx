"use client";

import { type ReactElement, useEffect, useState } from "react";

import { Button } from "../../../_components/ui/Button";
import { Card } from "../../../_components/ui/Card";

type UserMeResponse = {
	user: { id: string; name: string; email: string };
	kind: "user";
};

export function PlatformUserHomePlaceholder(): ReactElement {
	const [user, setUser] = useState<UserMeResponse["user"] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			const response = await fetch("/api/user/me", { credentials: "include" });
			if (cancelled) {
				return;
			}

			if (!response.ok) {
				setError("No se pudo cargar tu sesión");
				setLoading(false);

				return;
			}

			const data = (await response.json()) as UserMeResponse;
			setUser(data.user);
			setLoading(false);
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	async function logout(): Promise<void> {
		await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		window.location.assign("/u");
	}

	if (loading) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (error || !user) {
		return <p className="text-sm text-error">{error ?? "Sesión no disponible"}</p>;
	}

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<header className="flex flex-col gap-1">
				<p className="text-sm font-medium text-primary">Tu espacio</p>
				<h1 className="text-2xl font-semibold text-foreground">Hola, {user.name}</h1>
				<p className="text-sm text-muted">{user.email}</p>
			</header>

			<Card>
				<p className="text-sm text-muted">
					Próximamente verás aquí tus locales y negocios. El dashboard unificado llegará en la
					siguiente fase.
				</p>
			</Card>

			<Button type="button" variant="secondary" className="w-full" onClick={() => void logout()}>
				Cerrar sesión
			</Button>
		</main>
	);
}
