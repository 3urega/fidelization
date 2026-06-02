"use client";

import { type ReactElement, useEffect, useState } from "react";

import { Button } from "../_components/ui/Button";
import { Card } from "../_components/ui/Card";

type MeResponse = {
	user: { name: string };
	tenant: { name: string };
	role: string;
};

export function HomeDashboard(): ReactElement {
	const [data, setData] = useState<MeResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void fetch("/api/me", { credentials: "include" })
			.then(async (response) => {
				if (!response.ok) {
					setError("No se pudo cargar tu sesión");

					return null;
				}

				return (await response.json()) as MeResponse;
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

	const placeholders = [
		{ title: "Clientes", description: "Próximamente" },
		{ title: "Promociones", description: "Próximamente" },
		{ title: "Estadísticas", description: "Próximamente" },
	];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<p className="text-sm text-muted">Panel del propietario</p>
				<h1 className="text-2xl font-semibold text-foreground">Hola, {data.user.name}</h1>
				<p className="mt-1 text-sm text-muted">{data.tenant.name}</p>
			</div>

			<div className="grid gap-4">
				{placeholders.map((item) => (
					<Card key={item.title} className="opacity-70">
						<h2 className="font-medium text-foreground">{item.title}</h2>
						<p className="mt-1 text-sm text-muted">{item.description}</p>
					</Card>
				))}
			</div>

			<Button type="button" variant="secondary" disabled className="w-full">
				Más funciones en la siguiente fase
			</Button>
		</div>
	);
}
