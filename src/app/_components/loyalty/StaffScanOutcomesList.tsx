import type { ReactElement } from "react";

import {
	formatStaffScanOutcomeMessage,
	isStaffScanOutcome,
	type StaffScanOutcome,
} from "../../../contexts/loyalty/customers/domain/StaffScanOutcome";

type StaffScanCustomerSummary = {
	name: string;
	pointsBalance: number;
	visitsCount?: number;
};

type StaffScanOutcomesListProps = {
	outcomes: StaffScanOutcome[];
	customer?: StaffScanCustomerSummary | null;
};

function outcomeClassName(kind: StaffScanOutcome["kind"]): string {
	switch (kind) {
		case "stamp_added":
			return "font-semibold text-foreground";
		case "card_completed":
			return "font-medium text-primary";
		case "card_already_completed":
		case "promotion_exhausted":
			return "text-muted";
		case "point_recorded":
			return "text-muted";
		case "promotion_applied":
			return "text-foreground";
		case "roulette_spin_granted":
			return "font-medium text-primary";
		default: {
			const exhaustive: never = kind;

			return exhaustive;
		}
	}
}

export function StaffScanOutcomesList({
	outcomes,
	customer,
}: StaffScanOutcomesListProps): ReactElement | null {
	const validOutcomes = outcomes.filter(isStaffScanOutcome);

	if (validOutcomes.length === 0 && !customer) {
		return null;
	}

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
			{validOutcomes.length > 0 ? (
				<ul className="flex flex-col gap-2">
					{validOutcomes.map((outcome, index) => (
						<li
							key={`${outcome.kind}-${index}`}
							className={`text-sm ${outcomeClassName(outcome.kind)}`}
						>
							{formatStaffScanOutcomeMessage(outcome)}
						</li>
					))}
				</ul>
			) : null}
			{customer ? (
				<p className="text-sm text-muted">
					{customer.name} · {customer.pointsBalance} puntos
					{customer.visitsCount !== undefined ? ` · ${customer.visitsCount} visitas` : ""}
				</p>
			) : null}
		</div>
	);
}
