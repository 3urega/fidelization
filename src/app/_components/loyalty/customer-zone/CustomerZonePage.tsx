"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import {
	customerZoneTabUrl,
	parseCustomerZoneTab,
	type CustomerZoneTab,
} from "../../../../lib/loyalty/customerZoneRoutes";
import { useSwipeableTabs } from "../../shell/useSwipeableTabs";
import { CustomerZoneAllCustomersTable } from "./CustomerZoneAllCustomersTable";
import { CustomerZoneDashboardPanel } from "./CustomerZoneDashboardPanel";

const CUSTOMER_ZONE_TABS: CustomerZoneTab[] = ["dashboard", "all"];

export function CustomerZonePage(): ReactElement {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState<CustomerZoneTab>("dashboard");

	useEffect(() => {
		setActiveTab(parseCustomerZoneTab(searchParams.get("tab")));
	}, [searchParams]);

	function selectTab(tab: CustomerZoneTab): void {
		setActiveTab(tab);
		router.replace(customerZoneTabUrl(tab), { scroll: false });
	}

	const activeIndex = CUSTOMER_ZONE_TABS.indexOf(activeTab);
	const swipeRef = useSwipeableTabs({
		activeIndex: activeIndex >= 0 ? activeIndex : 0,
		tabCount: CUSTOMER_ZONE_TABS.length,
		onIndexChange: (index) => {
			const nextTab = CUSTOMER_ZONE_TABS[index];

			if (nextTab) {
				selectTab(nextTab);
			}
		},
	});

	const tabButtonClass = (tab: CustomerZoneTab): string =>
		[
			"rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
			activeTab === tab
				? "border-primary bg-primary/10 text-primary"
				: "border-border bg-surface text-muted hover:text-foreground",
		].join(" ");

	return (
		<div className="flex flex-col gap-6">
			<div
				className="flex flex-wrap gap-2 border-b border-border pb-4"
				role="tablist"
				aria-label="Secciones de clientes"
			>
				<button
					type="button"
					role="tab"
					id="customer-zone-tab-dashboard"
					aria-selected={activeTab === "dashboard"}
					aria-controls="customer-zone-tabpanel-dashboard"
					className={tabButtonClass("dashboard")}
					onClick={() => {
						selectTab("dashboard");
					}}
				>
					Dashboard
				</button>
				<button
					type="button"
					role="tab"
					id="customer-zone-tab-all"
					aria-selected={activeTab === "all"}
					aria-controls="customer-zone-tabpanel-all"
					className={tabButtonClass("all")}
					onClick={() => {
						selectTab("all");
					}}
				>
					Todos los clientes
				</button>
			</div>

			<div ref={swipeRef}>
				<div
					role="tabpanel"
					id="customer-zone-tabpanel-dashboard"
					aria-labelledby="customer-zone-tab-dashboard"
					hidden={activeTab !== "dashboard"}
					className={activeTab !== "dashboard" ? "hidden" : undefined}
				>
					<CustomerZoneDashboardPanel />
				</div>

				<div
					role="tabpanel"
					id="customer-zone-tabpanel-all"
					aria-labelledby="customer-zone-tab-all"
					hidden={activeTab !== "all"}
					className={activeTab !== "all" ? "hidden" : undefined}
				>
					<CustomerZoneAllCustomersTable isActive={activeTab === "all"} />
				</div>
			</div>
		</div>
	);
}
