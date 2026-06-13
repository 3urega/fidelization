import type { ReactElement } from "react";

import { PlatformOwnersTable } from "../../../_components/platform/PlatformOwnersTable";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformOwnersPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Comerciantes"
				description="Propietarios de negocios registrados en la plataforma."
			/>
			<PlatformOwnersTable />
		</div>
	);
}
