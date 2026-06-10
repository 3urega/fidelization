import { TenantProfileForm } from "../../../_components/tenant/TenantProfileForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function TenantProfileSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Datos del negocio"
				description="Descripción y dirección de tu local. Los clientes los verán en el detalle del negocio."
			/>
			<TenantProfileForm />
		</>
	);
}
