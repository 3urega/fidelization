import type { ReactElement } from "react";

import { PlatformCommunicationsPanel } from "../../../_components/platform/PlatformCommunicationsPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformCommunicationsPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Comunicación"
				description="Envía avisos por email o push (stub) a comerciantes, clientes app o staff de un negocio."
			/>
			<PlatformCommunicationsPanel />
		</div>
	);
}
