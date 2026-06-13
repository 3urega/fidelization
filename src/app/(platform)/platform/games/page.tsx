import type { ReactElement } from "react";

import { PlatformGamesPanel } from "../../../_components/platform/PlatformGamesPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformGamesPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Juegos"
				description="Biblioteca global de juegos de gamificación que los comerciantes podrán activar."
			/>
			<PlatformGamesPanel />
		</div>
	);
}
