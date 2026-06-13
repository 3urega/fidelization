import type { ReactElement } from "react";

import {
	type CustomerZoneListCustomer,
	formatDaysSinceLastVisit,
	formatRelativeLastVisit,
} from "../../../lib/loyalty/customerZone";
import { Card } from "../../ui/Card";
import { CustomerZoneStatusBadge } from "./CustomerZoneStatusBadge";

export type CustomerZoneCustomerCardVariant = "featured" | "at_risk" | "near_reward";

type CustomerZoneCustomerCardProps = {
	customer: CustomerZoneListCustomer;
	variant: CustomerZoneCustomerCardVariant;
};

function NearRewardLine({ customer }: { customer: CustomerZoneListCustomer }): ReactElement | null {
	const progress = customer.nearReward;

	if (!progress) {
		return null;
	}

	const remaining = progress.required - progress.current;

	return (
		<p className="mt-2 text-sm text-foreground">
			{progress.current} / {progress.required} ·{" "}
			{remaining === 1
				? "Le falta 1 para conseguir su premio"
				: `Le faltan ${remaining} para conseguir su premio`}
		</p>
	);
}

export function CustomerZoneCustomerCard({
	customer,
	variant,
}: CustomerZoneCustomerCardProps): ReactElement {
	const lastVisitLabel = formatRelativeLastVisit(customer.lastVisitAt);

	return (
		<Card className="p-4">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<h3 className="font-medium text-foreground">{customer.name}</h3>
				<CustomerZoneStatusBadge status={customer.status} />
			</div>

			{variant === "featured" ? (
				<>
					<p className="mt-2 text-sm text-foreground">
						{customer.visitsThisMonth}{" "}
						{customer.visitsThisMonth === 1 ? "visita este mes" : "visitas este mes"}
					</p>
					<p className="mt-1 text-sm text-muted">
						{customer.totalStamps}{" "}
						{customer.totalStamps === 1 ? "sello acumulado" : "sellos acumulados"}
					</p>
					<p className="mt-2 text-sm text-muted">
						Última visita: <span className="text-foreground">{lastVisitLabel}</span>
					</p>
				</>
			) : null}

			{variant === "at_risk" ? (
				<p className="mt-2 text-sm text-muted">{formatDaysSinceLastVisit(customer.lastVisitAt)}</p>
			) : null}

			{variant === "near_reward" ? (
				<>
					<NearRewardLine customer={customer} />
					{customer.nearReward ? (
						<p className="mt-1 text-xs text-muted">{customer.nearReward.campaignName}</p>
					) : null}
					<p className="mt-2 text-sm text-muted">
						Última visita: <span className="text-foreground">{lastVisitLabel}</span>
					</p>
				</>
			) : null}
		</Card>
	);
}
