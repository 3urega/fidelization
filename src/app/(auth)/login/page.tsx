import { LoginForm } from "../../_components/LoginForm";
import { AppShell } from "../../_components/ui/AppShell";

export default function LoginPage(): React.ReactElement {
	return (
		<AppShell
			title="Iniciar sesión"
			description="Accede al panel de tu negocio para gestionar la fidelización de clientes."
		>
			<LoginForm />
		</AppShell>
	);
}
