import type { StampProgressRow } from "../loyalty/LoyaltyCard";

/** One-line stamp progress for dashboard establishment cards. */
export function formatStampProgressLine(row: StampProgressRow): string {
	const typePrefix = row.stampTypeLabel ? `${row.stampTypeLabel}: ` : "";

	if (row.completed) {
		return `${typePrefix}Completada — ${row.campaignName}`;
	}

	return `${typePrefix}${row.current}/${row.required} — ${row.campaignName}`;
}
