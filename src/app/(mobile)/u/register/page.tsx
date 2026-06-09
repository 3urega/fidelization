import type { Metadata } from "next";

import { PlatformUserRegisterForm } from "../../../_components/platform-app/PlatformUserRegisterForm";
import { AppShell } from "../../../_components/ui/AppShell";

export const metadata: Metadata = {
	title: "Registrarse — App Fidelización",
};

export default function PlatformUserRegisterPage(): React.ReactElement {
	return (
		<AppShell
			title="Crear cuenta"
			description="Regístrate una vez para acumular puntos en locales y gestionar tus negocios."
		>
			<PlatformUserRegisterForm />
		</AppShell>
	);
}
