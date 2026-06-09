import type { Metadata } from "next";

import { PlatformUserLoginForm } from "../../../_components/platform-app/PlatformUserLoginForm";
import { AppShell } from "../../../_components/ui/AppShell";

export const metadata: Metadata = {
	title: "Iniciar sesión — App Fidelización",
};

export default function PlatformUserLoginPage(): React.ReactElement {
	return (
		<AppShell title="Iniciar sesión" description="Accede con tu cuenta de la app de fidelización.">
			<PlatformUserLoginForm />
		</AppShell>
	);
}
