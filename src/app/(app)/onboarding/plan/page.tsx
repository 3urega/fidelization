import { type ReactElement } from "react";

import { PlanSelectionForm } from "../../../_components/billing/PlanSelectionForm";
import { PageHeader } from "../../../_components/shell/PageHeader";

export default function OnboardingPlanPage(): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Elige tu plan"
				description="Paso 3 del alta: selecciona Basic, Pro o Premium para tu negocio."
			/>
			<PlanSelectionForm />
		</div>
	);
}
