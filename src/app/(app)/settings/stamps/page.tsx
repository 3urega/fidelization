import { StampCampaignsForm } from "../../../_components/loyalty/StampCampaignsForm";
import { StampTypesForm } from "../../../_components/loyalty/StampTypesForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function StampSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Tarjeta de sellos"
				description="Define tipos de consumición y campañas para que el empleado escaneé el carril correcto."
			/>
			<StampTypesForm />
			<StampCampaignsForm />
		</>
	);
}
