"use client";

import { type ReactElement } from "react";

import { PageHeader } from "../../_components/shell/PageHeader";
import { useTenantSession } from "../../_components/shell/TenantSessionProvider";
import { Button } from "../../_components/ui/Button";
import { Card } from "../../_components/ui/Card";

export function HomeDashboard(): ReactElement {
	const { session, loading, error } = useTenantSession();

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	const placeholders = [
		{ title: "Clientes", description: "Próximamente" },
		{ title: "Promociones", description: "Próximamente" },
		{ title: "Estadísticas", description: "Próximamente" },
	];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={`Hola, ${session.user.name}`}
				description={`Panel del negocio · ${session.tenant.name}`}
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{placeholders.map((item) => (
					<Card key={item.title} className="opacity-70">
						<h2 className="font-medium text-foreground">{item.title}</h2>
						<p className="mt-1 text-sm text-muted">{item.description}</p>
					</Card>
				))}
			</div>

			<Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
				Más funciones en la siguiente fase
			</Button>
		</div>
	);
}
