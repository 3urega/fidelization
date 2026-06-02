import { LoginForm } from "../../_components/LoginForm";
import { AppShell } from "../../_components/ui/AppShell";
import { getResolvedTenantFromHeaders } from "../../../lib/tenant/getResolvedTenant";

export default function LoginPage(): React.ReactElement {
	const hostTenant = getResolvedTenantFromHeaders();
	const hostTenantMissing = Boolean(process.env.APP_DOMAIN) && !hostTenant;

	return (
		<AppShell
			title="Iniciar sesión"
			description="Accede al panel de tu negocio para gestionar la fidelización de clientes."
		>
			<LoginForm hostTenantMissing={hostTenantMissing} />
		</AppShell>
	);
}
