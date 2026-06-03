import { BusinessRegisterForm } from "../../../_components/BusinessRegisterForm";
import { AppShell } from "../../../_components/ui/AppShell";

export default function BusinessRegisterPage(): React.ReactElement {
	return (
		<AppShell
			title="Crear cuenta"
			description="Registra tu usuario. En el siguiente paso configurarás tu negocio."
		>
			<BusinessRegisterForm />
		</AppShell>
	);
}
