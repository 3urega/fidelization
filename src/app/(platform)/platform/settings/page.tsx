import type { ReactElement } from "react";

import { PlatformSettingsPanel } from "../../../_components/platform/PlatformSettingsPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformSettingsPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Sistema"
				description="Branding del panel superadmin e integraciones críticas (solo lectura)."
			/>
			<PlatformSettingsPanel />
		</div>
	);
}
