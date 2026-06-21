import type { ReactElement } from "react";

import { PlatformModerationPanel } from "../../../_components/platform/PlatformModerationPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformModerationPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Moderación"
				description="Revisa reportes de negocios y promociones. Marca como resuelto o suspende el negocio afectado."
			/>
			<PlatformModerationPanel />
		</div>
	);
}
