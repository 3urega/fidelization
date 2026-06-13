"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import { useTenantSession } from "../shell/TenantSessionProvider";
import { StampCampaignsForm } from "./StampCampaignsForm";
import { StampTypesForm } from "./StampTypesForm";

type StampTab = "types" | "campaigns";

type StampTypePayload = {
	id: string;
	isActive: boolean;
};

export function StampSettingsPanel(): ReactElement {
	const { session, loading, error } = useTenantSession();
	const [activeTab, setActiveTab] = useState<StampTab>("types");
	const [initialTabSet, setInitialTabSet] = useState(false);
	const [activeTypesCount, setActiveTypesCount] = useState(0);
	const [typesLoading, setTypesLoading] = useState(true);

	const refreshActiveTypesCount = useCallback(async (): Promise<void> => {
		setTypesLoading(true);

		try {
			const response = await fetch("/api/loyalty/stamp-types", {
				credentials: "include",
			});
			const body = (await response.json()) as { types?: StampTypePayload[] };

			if (response.ok) {
				const activeCount = (body.types ?? []).filter((type) => type.isActive).length;
				setActiveTypesCount(activeCount);
			} else {
				setActiveTypesCount(0);
			}
		} catch {
			setActiveTypesCount(0);
		} finally {
			setTypesLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!session || session.role !== "owner") {
			return;
		}

		void refreshActiveTypesCount();
	}, [session, refreshActiveTypesCount]);

	useEffect(() => {
		if (initialTabSet || typesLoading) {
			return;
		}

		setActiveTab(activeTypesCount > 0 ? "campaigns" : "types");
		setInitialTabSet(true);
	}, [activeTypesCount, initialTabSet, typesLoading]);

	const handleTypesChanged = useCallback((): void => {
		void refreshActiveTypesCount();
	}, [refreshActiveTypesCount]);

	const handleGoToTypesTab = useCallback((): void => {
		setActiveTab("types");
	}, []);

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (loading || !session) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	const tabButtonClass = (tab: StampTab): string =>
		[
			"rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
			activeTab === tab
				? "border-primary bg-primary/10 text-primary"
				: "border-border bg-surface text-muted hover:text-foreground",
		].join(" ");

	return (
		<div className="flex flex-col gap-6">
			<div
				className="flex flex-wrap gap-2 border-b border-border pb-4"
				role="tablist"
				aria-label="Configuración de sellos"
			>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "types"}
					className={tabButtonClass("types")}
					onClick={() => setActiveTab("types")}
				>
					Tipos de consumición
					{activeTypesCount > 0 ? (
						<span className="ml-1.5 text-xs opacity-80">({activeTypesCount})</span>
					) : null}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "campaigns"}
					className={tabButtonClass("campaigns")}
					onClick={() => setActiveTab("campaigns")}
				>
					Campañas
				</button>
			</div>

			<div role="tabpanel">
				{activeTab === "types" ? (
					<StampTypesForm onTypesChanged={handleTypesChanged} />
				) : (
					<StampCampaignsForm
						hasActiveTypes={activeTypesCount > 0}
						onGoToTypesTab={handleGoToTypesTab}
					/>
				)}
			</div>
		</div>
	);
}
