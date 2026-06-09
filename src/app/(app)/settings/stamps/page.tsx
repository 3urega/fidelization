import { StampCampaignsForm } from "../../../_components/loyalty/StampCampaignsForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function StampSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Tarjeta de sellos"
				description="Crea una campaña para que tus clientes acumulen sellos en cada visita."
			/>
			<StampCampaignsForm />
		</>
	);
}
