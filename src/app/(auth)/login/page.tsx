import type { Metadata } from "next";

import { getResolvedTenantFromHeaders } from "../../../lib/tenant/getResolvedTenant";
import { safeRedirectPath } from "../../../lib/auth/safeRedirectPath";
import { platformRoutes } from "../../../lib/platform/routes";
import { PlatformGoogleOAuthEnabledMarker } from "../../_components/platform-app/PlatformGoogleOAuthEnabledMarker";
import { PlatformGoogleOAuthProvider } from "../../_components/platform-app/PlatformGoogleOAuthProvider";
import { PlatformUserLoginForm } from "../../_components/platform-app/PlatformUserLoginForm";
import { LoginForm } from "../../_components/LoginForm";
import { AppShell } from "../../_components/ui/AppShell";

export const metadata: Metadata = {
	title: "Iniciar sesión — Fidelización",
};

type LoginPageProps = {
	searchParams?: { next?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps): React.ReactElement {
	const hostTenant = getResolvedTenantFromHeaders();
	const hostTenantMissing = Boolean(process.env.APP_DOMAIN) && !hostTenant;

	if (hostTenant) {
		return (
			<AppShell
				title="Iniciar sesión"
				description="Accede al panel de tu negocio para gestionar la fidelización de clientes."
			>
				<LoginForm hostTenantMissing={hostTenantMissing} />
			</AppShell>
		);
	}

	const redirectTo = safeRedirectPath(searchParams?.next) ?? platformRoutes.home;

	return (
		<PlatformGoogleOAuthProvider>
			<AppShell title="Iniciar sesión" description="Accede con tu cuenta de la app de fidelización.">
				<PlatformGoogleOAuthEnabledMarker />
				<PlatformUserLoginForm redirectTo={redirectTo} />
			</AppShell>
		</PlatformGoogleOAuthProvider>
	);
}
