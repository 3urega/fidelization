import { GamificationGamesPanel } from "../../../_components/loyalty/GamificationGamesPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function GamificationSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Juegos"
				description="Gamificación para fidelizar clientes. Configura juegos como la ruleta desde cada tarjeta."
			/>
			<GamificationGamesPanel />
		</>
	);
}
