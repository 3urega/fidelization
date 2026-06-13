import type { ReactElement } from "react";

import { PlatformPlansCatalogPanel } from "../../../_components/platform/PlatformPlansCatalogPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformPlansPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Planes"
				description="Catálogo global Basic, Pro y Premium. Los cambios aplican a todos los tenants del plan."
			/>
			<PlatformPlansCatalogPanel />
		</div>
	);
}
