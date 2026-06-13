import type { ReactElement } from "react";

import { PlatformTenantsTable } from "../../../_components/platform/PlatformTenantsTable";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformTenantsPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Negocios"
				description="Lista de tenants, planes y estado operativo."
			/>
			<PlatformTenantsTable />
		</div>
	);
}
