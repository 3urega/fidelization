import Link from "next/link";
import type { ReactElement } from "react";

import { PlatformAppUserDetailPanel } from "../../../../_components/platform/PlatformAppUserDetailPanel";
import { PageHeader } from "../../../../_components/shell/PageHeader";

type PlatformAppUserDetailPageProps = {
	params: { userId: string };
};

export default function PlatformAppUserDetailPage({
	params,
}: PlatformAppUserDetailPageProps): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Detalle del cliente"
				description="Perfil read-only, locales vinculados y transacciones recientes."
			>
				<Link href="/platform/users" className="text-sm text-primary hover:opacity-80">
					← Volver a Clientes
				</Link>
			</PageHeader>
			<PlatformAppUserDetailPanel userId={params.userId} />
		</div>
	);
}
