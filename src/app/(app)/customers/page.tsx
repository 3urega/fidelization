import { PageHeader } from "../../_components/shell/PageHeader";
import { CustomerZonePage } from "../../_components/loyalty/customer-zone/CustomerZonePage";

export default function CustomersPage(): React.ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Clientes"
				description="Conoce a tus clientes fieles, detecta riesgo de abandono y quién está cerca de una recompensa."
			/>
			<CustomerZonePage />
		</div>
	);
}
