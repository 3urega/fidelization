import type { Metadata } from "next";

import { PlatformUserRegisterForm } from "../../../_components/platform-app/PlatformUserRegisterForm";
import { AppShell } from "../../../_components/ui/AppShell";
import { safeRedirectPath } from "../../../lib/auth/safeRedirectPath";

export const metadata: Metadata = {
	title: "Registrarse — App Fidelización",
};

type PlatformUserRegisterPageProps = {
	searchParams?: { next?: string };
};

export default function PlatformUserRegisterPage({
	searchParams,
}: PlatformUserRegisterPageProps): React.ReactElement {
	const redirectTo = safeRedirectPath(searchParams?.next) ?? "/u/home";

	return (
		<AppShell
			title="Crear cuenta"
			description="Regístrate una vez para acumular puntos en locales y gestionar tus negocios."
		>
			<PlatformUserRegisterForm redirectTo={redirectTo} />
		</AppShell>
	);
}
