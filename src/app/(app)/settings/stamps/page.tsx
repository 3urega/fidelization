import { StampSettingsPanel } from "../../../_components/loyalty/StampSettingsPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function StampSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Tarjeta de sellos"
				description="Los tipos etiquetan las campañas aquí; en /scan el empleado elige la tarjeta concreta."
			/>
			<StampSettingsPanel />
		</>
	);
}
