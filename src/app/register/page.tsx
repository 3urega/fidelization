import { RegisterForm } from "../_components/RegisterForm";
import { AppShell } from "../_components/ui/AppShell";

export default function RegisterPage(): React.ReactElement {
	return (
		<AppShell
			title="Crear cuenta"
			description="Registra tu negocio y empieza a fidelizar clientes en minutos."
		>
			<RegisterForm />
		</AppShell>
	);
}
