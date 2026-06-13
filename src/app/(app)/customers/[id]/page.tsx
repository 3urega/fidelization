import { CustomerDetailPanel } from "../../../_components/loyalty/customer-zone/CustomerDetailPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function CustomerDetailPage(): React.ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Ficha de cliente"
				description="Consulta el historial, los programas activos y las recompensas de un cliente."
			/>
			<CustomerDetailPanel />
		</div>
	);
}
