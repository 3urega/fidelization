"use client";

import { type ReactElement, useEffect, useState } from "react";

import { PlatformTenantsTable } from "../../_components/platform/PlatformTenantsTable";
import { PageHeader } from "../../_components/shell/PageHeader";

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
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={`Hola, ${data.user.name}`}
				description={`Panel de plataforma · ${data.user.email}`}
			/>

			<PlatformTenantsTable />
		</div>
	);
}
