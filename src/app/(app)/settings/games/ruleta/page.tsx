import { RouletteConfigEditor } from "../../../../_components/loyalty/RouletteConfigEditor";
import { PageHeader } from "../../../../_components/shell/PageHeader";

export default function RouletteSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Ruleta"
				description="Configura los segmentos, premios y probabilidades de la ruleta de fidelización."
			/>
			<RouletteConfigEditor />
		</>
	);
}
