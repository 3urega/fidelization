export type CustomerZoneTab = "dashboard" | "all";

export function parseCustomerZoneTab(value: string | null | undefined): CustomerZoneTab {
	if (value === "all") {
		return "all";
	}

	return "dashboard";
}

export function customerZoneTabUrl(tab: CustomerZoneTab): string {
	return `/customers?tab=${tab}`;
}
