import type { ReactElement } from "react";

import { PlatformAnalyticsPanel } from "../../../_components/platform/PlatformAnalyticsPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformAnalyticsPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Analítica"
				description="Actividad de fidelización cross-tenant y rankings por negocio."
			/>
			<PlatformAnalyticsPanel />
		</div>
	);
}
