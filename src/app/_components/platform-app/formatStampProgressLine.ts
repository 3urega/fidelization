import type { StampProgressRow } from "../../loyalty/LoyaltyCard";

/** One-line stamp progress for dashboard establishment cards. */
export function formatStampProgressLine(row: StampProgressRow): string {
	if (row.completed) {
		return `Completada — ${row.campaignName}`;
	}

	return `${row.current}/${row.required} — ${row.campaignName}`;
}
