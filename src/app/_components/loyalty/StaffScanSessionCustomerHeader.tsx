import type { ReactElement } from "react";

import type { StaffScanSessionCustomer } from "./staffScanSessionTypes";

type StaffScanSessionCustomerHeaderProps = {
	customer: StaffScanSessionCustomer;
};

export function StaffScanSessionCustomerHeader({
	customer,
}: StaffScanSessionCustomerHeaderProps): ReactElement {
	return (
		<div className="rounded-xl border border-border bg-surface p-4">
			<p className="text-lg font-semibold text-foreground">{customer.name}</p>
			<p className="mt-1 text-sm text-muted">
				{customer.pointsBalance} puntos · {customer.visitsCount} visitas
			</p>
		</div>
	);
}
