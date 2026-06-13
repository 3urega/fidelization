import type { ReactElement } from "react";

import { PlatformTenantDetailPanel } from "../../../_components/platform/PlatformTenantDetailPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

type PlatformTenantDetailPageProps = {
	params: { tenantId: string };
};

export default function PlatformTenantDetailPage({
	params,
}: PlatformTenantDetailPageProps): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Detalle del negocio" description="Metadatos, plan y actividad del tenant." />
			<PlatformTenantDetailPanel tenantId={params.tenantId} />
		</div>
	);
}
