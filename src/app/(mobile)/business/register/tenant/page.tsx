import type { Metadata } from "next";

import { PlatformBusinessCreationForm } from "../../../../_components/platform-app/PlatformBusinessCreationForm";
import { AppShell } from "../../../../_components/ui/AppShell";

export const metadata: Metadata = {
	title: "Tu negocio — App Fidelización",
};

export default function PlatformBusinessTenantStepPage(): React.ReactElement {
	return (
		<AppShell
			title="Tu negocio"
			description="Indica el nombre y el tipo de negocio para empezar a fidelizar clientes."
		>
			<PlatformBusinessCreationForm />
		</AppShell>
	);
}
