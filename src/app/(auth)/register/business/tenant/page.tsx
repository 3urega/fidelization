import { BusinessCreationForm } from "../../../../_components/BusinessCreationForm";
import { AppShell } from "../../../../_components/ui/AppShell";
export default function BusinessTenantRegisterPage(): React.ReactElement {
	return (
		<AppShell
			title="Tu negocio"
			description="Indica el nombre y el tipo de negocio para empezar a fidelizar clientes."
		>
			<BusinessCreationForm />
		</AppShell>
	);
}
