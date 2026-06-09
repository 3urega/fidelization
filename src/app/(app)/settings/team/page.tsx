import { TenantEmployeesForm } from "../../../_components/tenant/TenantEmployeesForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function TeamSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Equipo"
				description="Invita empleados para que escaneen QR y registren visitas de clientes."
			/>
			<TenantEmployeesForm />
		</>
	);
}
