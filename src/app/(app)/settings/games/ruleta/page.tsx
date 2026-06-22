import { RouletteConfigEditor } from "../../../../_components/loyalty/RouletteConfigEditor";
import { PageHeader } from "../../../../_components/shell/PageHeader";

export default function RouletteSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Ruleta"
				description="Configura premios, cuotas de participación y condiciones. Flujo: activar en app → autorizar en caja → girar."
			/>
			<RouletteConfigEditor />
		</>
	);
}
