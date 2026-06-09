import { type ReactElement, Suspense } from "react";

import { PlanSelectionForm } from "../../../_components/billing/PlanSelectionForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function OnboardingPlanPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Elige tu plan"
				description="Paso 3 del alta: Basic gratis al instante; Pro y Premium con pago seguro en Stripe."
			/>
			<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
				<PlanSelectionForm />
			</Suspense>
		</div>
	);
}
