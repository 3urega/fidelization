import type { ReactElement } from "react";

import { CustomerSegmentSection } from "./CustomerSegmentSection";
import { CustomerZoneInsights } from "./CustomerZoneInsights";

export function CustomerZoneDashboardPanel(): ReactElement {
	return (
		<div className="flex flex-col gap-8">
			<CustomerZoneInsights />

			<CustomerSegmentSection
				title="Clientes destacados"
				description="Tus clientes más activos este mes."
				segment="featured"
				variant="featured"
				emptyMessage="Aún no hay visitas este mes."
			/>

			<CustomerSegmentSection
				title="Clientes en riesgo"
				description="Clientes que llevan tiempo sin visitarte."
				segment="at_risk"
				variant="at_risk"
				emptyMessage="Ningún cliente en riesgo ahora mismo."
				showRewardCta
			/>

			<CustomerSegmentSection
				title="Cumpliendo objetivos"
				description="A un sello de conseguir su premio."
				segment="near_reward"
				variant="near_reward"
				emptyMessage="Nadie a un sello del premio."
			/>
		</div>
	);
}
