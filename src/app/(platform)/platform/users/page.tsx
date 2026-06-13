import type { ReactElement } from "react";

import { PlatformAppUsersTable } from "../../../_components/platform/PlatformAppUsersTable";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformAppUsersPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Clientes"
				description="Usuarios de la app personal con actividad de fidelización."
			/>
			<PlatformAppUsersTable />
		</div>
	);
}
