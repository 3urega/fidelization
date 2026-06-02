"use client";

import { type ReactElement } from "react";

import { usePlatformSession } from "../../_components/platform/PlatformSessionProvider";
import { PlatformTenantsTable } from "../../_components/platform/PlatformTenantsTable";
import { PageHeader } from "../../_components/shell/PageHeader";

export function PlatformDashboard(): ReactElement {
	const { session, loading, error } = usePlatformSession();

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={`Hola, ${session.user.name}`}
				description={`Panel de plataforma · ${session.user.email}`}
			/>

			<PlatformTenantsTable />
		</div>
	);
}
