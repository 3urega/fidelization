/** MVP: fixed points per staff scan until tenant-configurable rules exist. */
export const DEFAULT_POINTS_PER_VISIT = 1;

export type StampProgressSummary = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
	stampTypeId: string | null;
	stampTypeLabel: string;
	visualTemplate: string;
	cardBackgroundVariant: string;
	conditions: string;
};

/** @deprecated Use StampProgressSummary — kept for gradual rename at call sites. */
export type StampAddedSummary = StampProgressSummary;
