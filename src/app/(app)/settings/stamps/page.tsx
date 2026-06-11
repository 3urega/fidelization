import { StampSettingsPanel } from "../../../_components/loyalty/StampSettingsPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function StampSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Tarjeta de sellos"
				description="Primero define tipos de consumición; después crea campañas ligadas a cada tipo."
			/>
			<StampSettingsPanel />
		</>
	);
}
