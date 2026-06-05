import type { ReactElement } from "react";

import { CustomerWelcomeForm } from "../../../_components/loyalty/CustomerWelcomeForm";
import { Card } from "../../../_components/ui/Card";

export default function CustomerWelcomePage(): ReactElement {
	return (
		<Card>
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold text-foreground">Tu tarjeta de fidelización</h1>
				<p className="text-sm text-muted">
					Introduce tu nombre para obtener tu tarjeta y mostrar tu código QR al personal.
				</p>
			</div>
			<CustomerWelcomeForm />
		</Card>
	);
}
