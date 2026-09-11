import type { ReactElement } from "react";

import {
	formatStaffScanOutcomeMessage,
	type StaffScanOutcome,
} from "../../../contexts/loyalty/customers/domain/StaffScanOutcome";

import { StaffScanOutcomesList } from "./StaffScanOutcomesList";

type StaffScanActionFeedbackProps = {
	outcomes: StaffScanOutcome[];
	customer?: {
		name: string;
		pointsBalance: number;
		visitsCount?: number;
	} | null;
};

export function StaffScanActionFeedback({
	outcomes,
	customer,
}: StaffScanActionFeedbackProps): ReactElement | null {
	const rouletteOutcome = outcomes.find((outcome) => outcome.kind === "roulette_spin_granted");
	const authGrantedOutcome = outcomes.find((outcome) => outcome.kind === "roulette_auth_granted");
	const authDeniedOutcome = outcomes.find((outcome) => outcome.kind === "roulette_auth_denied");

	const listOutcomes = outcomes.filter(
		(outcome) =>
			outcome.kind !== "roulette_spin_granted" &&
			outcome.kind !== "roulette_auth_granted" &&
			outcome.kind !== "roulette_auth_denied",
	);

	if (
		!rouletteOutcome &&
		!authGrantedOutcome &&
		!authDeniedOutcome &&
		listOutcomes.length === 0 &&
		!customer
	) {
		return null;
	}

	return (
		<div className="flex flex-col gap-3">
			{rouletteOutcome ? (
				<div className="rounded-xl border-2 border-primary bg-primary/10 p-4">
					<p className="text-sm font-semibold text-primary">
						{formatStaffScanOutcomeMessage(rouletteOutcome)}
					</p>
					<p className="mt-1 text-sm text-foreground">
						Indica al cliente que abra la app y gire la ruleta en el detalle del local.
					</p>
				</div>
			) : null}

			{authGrantedOutcome ? (
				<div className="rounded-xl border-2 border-primary bg-primary/10 p-4">
					<p className="text-sm font-semibold text-primary">
						{formatStaffScanOutcomeMessage(authGrantedOutcome)}
					</p>
					<p className="mt-1 text-sm text-foreground">
						El cliente ya puede girar la ruleta en su app personal.
					</p>
				</div>
			) : null}

			{authDeniedOutcome ? (
				<div className="rounded-xl border-2 border-error bg-error/10 p-4">
					<p className="text-sm font-semibold text-error">
						{formatStaffScanOutcomeMessage(authDeniedOutcome)}
					</p>
				</div>
			) : null}

			{listOutcomes.length > 0 || customer ? (
				<StaffScanOutcomesList outcomes={listOutcomes} customer={customer} />
			) : null}
		</div>
	);
}
