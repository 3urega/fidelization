export type OwnerPanelTab = "dashboard" | "config";

export function parseOwnerPanelTab(
	value: string | null | undefined,
	options: { allowDashboard: boolean },
): OwnerPanelTab {
	if (options.allowDashboard && (value === "dashboard" || value === null || value === undefined)) {
		return "dashboard";
	}

	if (value === "config") {
		return "config";
	}

	return options.allowDashboard ? "dashboard" : "config";
}

export function ownerPanelTabUrl(tab: OwnerPanelTab): string {
	return `/panel?tab=${tab}`;
}
