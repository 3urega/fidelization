"use client";

import { type ReactElement, useEffect, useState } from "react";

import { Card } from "../../_components/ui/Card";

type PlatformMeResponse = {
	user: { name: string; email: string };
	role: string;
	kind: string;
};

export function PlatformDashboard(): ReactElement {
	const [data, setData] = useState<PlatformMeResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void fetch("/api/platform/me", { credentials: "include" })
			.then(async (response) => {
				if (!response.ok) {
					setError("No se pudo cargar la sesión de plataforma");

					return null;
				}

				return (await response.json()) as PlatformMeResponse;
			})
			.then((me) => {
				if (me) {
					setData(me);
				}
			});
	}, []);

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (!data) {
		return <p className="text-sm text-muted">Cargando...</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<p className="text-sm text-muted">Superadmin — contexto plataforma</p>
				<h1 className="text-2xl font-semibold text-foreground">Hola, {data.user.name}</h1>
				<p className="mt-1 text-sm text-muted">{data.user.email}</p>
			</div>

			<Card>
				<h2 className="font-medium text-foreground">Panel de plataforma</h2>
				<p className="mt-2 text-sm text-muted">
					CRUD de tenants, planes y feature flags globales — próxima fase. Este dashboard confirma
					sesión <code className="text-xs">{data.kind}</code> / rol{" "}
					<code className="text-xs">{data.role}</code>.
				</p>
			</Card>
		</div>
	);
}
