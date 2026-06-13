import type { ReactElement } from "react";

import { PlatformCampaignTemplatesPanel } from "../../../_components/platform/PlatformCampaignTemplatesPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformCampaignTemplatesPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Plantillas"
				description="Biblioteca global de campañas de sellos que los comerciantes pueden adoptar."
			/>
			<PlatformCampaignTemplatesPanel />
		</div>
	);
}
