import { TenantProfileForm } from "../../../_components/tenant/TenantProfileForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function TenantProfileSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Datos del negocio"
				description="Imagen de portada, tags, descripción y dirección. Los clientes los verán en exploración y en el detalle del negocio."
			/>
			<TenantProfileForm />
		</>
	);
}
