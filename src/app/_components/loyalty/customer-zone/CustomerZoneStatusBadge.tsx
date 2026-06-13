import type { ReactElement } from "react";

import {
	type CustomerEngagementStatus,
	formatCustomerZoneStatus,
} from "../../../../lib/loyalty/customerZone";

type CustomerZoneStatusBadgeProps = {
	status: CustomerEngagementStatus;
};

function statusClassName(status: CustomerEngagementStatus): string {
	const base = "inline-flex rounded-theme border border-border bg-background px-2 py-0.5 text-xs font-medium";

	switch (status) {
		case "vip":
			return `${base} text-primary`;
		case "at_risk":
		case "inactive":
			return `${base} text-error`;
		case "active":
		default:
			return `${base} text-muted`;
	}
}

export function CustomerZoneStatusBadge({ status }: CustomerZoneStatusBadgeProps): ReactElement {
	return (
		<span className={statusClassName(status)}>{formatCustomerZoneStatus(status)}</span>
	);
}
