"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactElement, useEffect, useMemo, useState } from "react";

import { StampCampaignDashboardPanel } from "../../_components/loyalty/StampCampaignDashboardPanel";
import { PageHeader } from "../../_components/shell/PageHeader";
import { useSwipeableTabs } from "../../_components/shell/useSwipeableTabs";
import { useTenantSession } from "../../_components/shell/TenantSessionProvider";
import {
	ownerPanelTabUrl,
	parseOwnerPanelTab,
	type OwnerPanelTab,
} from "../../../lib/tenant/ownerPanelRoutes";
import { OwnerConfigurationPanel } from "./OwnerConfigurationPanel";

const OWNER_TABS: OwnerPanelTab[] = ["dashboard", "config"];

export function OwnerHomeTabs(): ReactElement {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { session, loading, error } = useTenantSession();
	const [activeTab, setActiveTab] = useState<OwnerPanelTab>("dashboard");

	const allowDashboard = session?.role === "owner";
	const tabs = useMemo(
		() => (allowDashboard ? OWNER_TABS : (["config"] as OwnerPanelTab[])),
		[allowDashboard],
	);

	useEffect(() => {
		setActiveTab(parseOwnerPanelTab(searchParams.get("tab"), { allowDashboard: allowDashboard ?? false }));
	}, [searchParams, allowDashboard]);

	useEffect(() => {
		if (!session || session.role === "owner") {
			return;
		}

		if (searchParams.get("tab") === "dashboard") {
			router.replace(ownerPanelTabUrl("config"), { scroll: false });
		}
	}, [session, searchParams, router]);

	function selectTab(tab: OwnerPanelTab): void {
		setActiveTab(tab);
		router.replace(ownerPanelTabUrl(tab), { scroll: false });
	}

	const activeIndex = tabs.indexOf(activeTab);
	const swipeRef = useSwipeableTabs({
		activeIndex: activeIndex >= 0 ? activeIndex : 0,
		tabCount: tabs.length,
		onIndexChange: (index) => {
			const nextTab = tabs[index];

			if (nextTab) {
				selectTab(nextTab);
			}
		},
	});

	const tabButtonClass = (tab: OwnerPanelTab): string =>
		[
			"rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
			activeTab === tab
				? "border-primary bg-primary/10 text-primary"
				: "border-border bg-surface text-muted hover:text-foreground",
		].join(" ");

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={`Hola, ${session.user.name}`}
				description={`Panel del negocio · ${session.tenant.name}`}
			/>

			{allowDashboard ? (
				<div
					className="flex flex-wrap gap-2 border-b border-border pb-4"
					role="tablist"
					aria-label="Secciones del panel"
				>
					<button
						type="button"
						role="tab"
						id="owner-panel-tab-dashboard"
						aria-selected={activeTab === "dashboard"}
						aria-controls="owner-panel-tabpanel-dashboard"
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
						id="owner-panel-tab-config"
						aria-selected={activeTab === "config"}
						aria-controls="owner-panel-tabpanel-config"
						className={tabButtonClass("config")}
						onClick={() => {
							selectTab("config");
						}}
					>
						Configuración
					</button>
				</div>
			) : null}

			<div ref={swipeRef}>
				{allowDashboard ? (
					<div
						role="tabpanel"
						id="owner-panel-tabpanel-dashboard"
						aria-labelledby="owner-panel-tab-dashboard"
						hidden={activeTab !== "dashboard"}
						className={activeTab === "dashboard" ? undefined : "hidden"}
					>
						<StampCampaignDashboardPanel isActive={activeTab === "dashboard"} />
					</div>
				) : null}

				<div
					role="tabpanel"
					id="owner-panel-tabpanel-config"
					aria-labelledby={allowDashboard ? "owner-panel-tab-config" : undefined}
					hidden={allowDashboard ? activeTab !== "config" : false}
					className={allowDashboard && activeTab !== "config" ? "hidden" : undefined}
				>
					<OwnerConfigurationPanel />
				</div>
			</div>
		</div>
	);
}
