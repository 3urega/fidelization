import type { Metadata } from "next";

import { PlatformUserLoginForm } from "../../../_components/platform-app/PlatformUserLoginForm";
import { AppShell } from "../../../_components/ui/AppShell";
import { safeRedirectPath } from "../../../../lib/auth/safeRedirectPath";

export const metadata: Metadata = {
	title: "Iniciar sesión — App Fidelización",
};

type PlatformUserLoginPageProps = {
	searchParams?: { next?: string };
};

export default function PlatformUserLoginPage({
	searchParams,
}: PlatformUserLoginPageProps): React.ReactElement {
	const redirectTo = safeRedirectPath(searchParams?.next) ?? "/u/home";

	return (
		<AppShell title="Iniciar sesión" description="Accede con tu cuenta de la app de fidelización.">
			<PlatformUserLoginForm redirectTo={redirectTo} />
		</AppShell>
	);
}
