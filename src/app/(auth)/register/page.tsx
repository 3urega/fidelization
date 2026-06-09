import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getResolvedTenantFromHeaders } from "../../../lib/tenant/getResolvedTenant";
import { safeRedirectPath } from "../../../lib/auth/safeRedirectPath";
import { platformRoutes } from "../../../lib/platform/routes";
import { PlatformGoogleOAuthEnabledMarker } from "../../_components/platform-app/PlatformGoogleOAuthEnabledMarker";
import { PlatformGoogleOAuthProvider } from "../../_components/platform-app/PlatformGoogleOAuthProvider";
import { PlatformUserRegisterForm } from "../../_components/platform-app/PlatformUserRegisterForm";
import { AppShell } from "../../_components/ui/AppShell";

export const metadata: Metadata = {
	title: "Registrarse — App Fidelización",
};

type RegisterPageProps = {
	searchParams?: { next?: string };
};

export default function RegisterPage({ searchParams }: RegisterPageProps): React.ReactElement {
	const hostTenant = getResolvedTenantFromHeaders();

	if (hostTenant) {
		redirect("/register/business");
	}

	const redirectTo = safeRedirectPath(searchParams?.next) ?? platformRoutes.home;

	return (
		<PlatformGoogleOAuthProvider>
			<AppShell
				title="Crear cuenta"
				description="Regístrate una vez para acumular puntos en locales y gestionar tus negocios."
			>
				<PlatformGoogleOAuthEnabledMarker />
				<PlatformUserRegisterForm redirectTo={redirectTo} />
			</AppShell>
		</PlatformGoogleOAuthProvider>
	);
}
