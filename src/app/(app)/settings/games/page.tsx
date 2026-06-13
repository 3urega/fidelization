import { GamificationGamesPanel } from "../../../_components/loyalty/GamificationGamesPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function GamificationSettingsPage(): React.ReactElement {
	return (
		<>
			<PageHeader
				title="Juegos"
				description="Gamificación para fidelizar clientes. Los juegos se activarán próximamente."
			/>
			<GamificationGamesPanel />
		</>
	);
}
