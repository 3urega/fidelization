export function formatPlanPriceMonthly(cents: number): string {
	if (cents <= 0) {
		return "Gratis";
	}

	return `${Math.round(cents / 100)} €/mes`;
}
