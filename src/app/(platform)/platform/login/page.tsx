import { PlatformLoginForm } from "../../../_components/PlatformLoginForm";
import { AppShell } from "../../../_components/ui/AppShell";

export default function PlatformLoginPage(): React.ReactElement {
	return (
		<AppShell
			title="Plataforma — Superadmin"
			description="Gestión del SaaS (tenants, planes, módulos). Solo apex, sin subdominio de negocio."
		>
			<PlatformLoginForm />
		</AppShell>
	);
}
