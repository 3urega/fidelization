import type { Metadata } from "next";

import { AppShell } from "../../../../../_components/ui/AppShell";

export const metadata: Metadata = {
	title: "Tu negocio — App Fidelización",
};

/** Placeholder until VS3 (business creation form). Middleware auth gate lands here when session is valid. */
export default function PlatformBusinessTenantStepPage(): React.ReactElement {
	return (
		<AppShell
			title="Tu negocio"
			description="Indica el nombre y el tipo de negocio para empezar a fidelizar clientes."
		>
			<p className="text-sm text-muted">Formulario de creación del negocio — siguiente slice (VS3).</p>
		</AppShell>
	);
}
