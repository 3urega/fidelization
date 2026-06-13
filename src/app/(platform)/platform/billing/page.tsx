import type { ReactElement } from "react";

import { PlatformBillingOverviewPanel } from "../../../_components/platform/PlatformBillingOverviewPanel";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function PlatformBillingPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Facturación"
				description="MRR estimado, suscripciones Stripe y problemas de cobro."
			/>
			<PlatformBillingOverviewPanel />
		</div>
	);
}
