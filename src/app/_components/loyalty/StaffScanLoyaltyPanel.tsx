"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import type { StaffScanOutcome } from "../../../contexts/loyalty/customers/domain/StaffScanOutcome";
import { Button } from "../ui/Button";
import { StaffScanActionFeedback } from "./StaffScanActionFeedback";
import { LoyaltyCardBackground } from "./LoyaltyCardBackground";
import type { LoyaltyCardBackgroundVariant } from "./loyaltyCardBackgrounds";
import { resolveLoyaltyCardBackground } from "./loyaltyCardBackgrounds";
import { LoyaltyProgress } from "./LoyaltyProgress";
import { parseLoyaltyVisualTemplate } from "./loyaltyVisualTemplates";
import { recordStaffScanByTarget } from "./recordStaffScanByTarget";
import type {
	StaffScanSessionData,
	StaffScanSessionPromotion,
	StaffScanSessionStampCard,
} from "./staffScanSessionTypes";

type LoyaltyTab = "stamps" | "promos";

type LoadingTarget = {
	targetType: "stamp_campaign" | "promotion";
	targetId: string;
};

type StaffScanLoyaltyPanelProps = {
	session: StaffScanSessionData;
	pendingQrValue: string | null;
	onAfterAction: () => Promise<void>;
};

function stampBlockMessage(card: StaffScanSessionStampCard): string | null {
	if (card.canAddStamp) {
		return null;
	}

	if (card.blockReason === "completed") {
		return "Tarjeta completada. No se pueden añadir más sellos.";
	}

	return "No puedes añadir sellos en esta tarjeta ahora.";
}

function promotionBlockMessage(promotion: StaffScanSessionPromotion): string | null {
	if (promotion.canApply) {
		return null;
	}

	if (promotion.blockReason === "exhausted") {
		return "Usos agotados para este cliente.";
	}

	if (promotion.blockReason === "inactive") {
		return "Promoción no activa.";
	}

	return "No se puede aplicar esta promoción ahora.";
}

function promotionUsesLabel(promotion: StaffScanSessionPromotion): string | null {
	if (promotion.maxUsesPerUser === null) {
		return null;
	}

	return `${promotion.usedCount} / ${promotion.maxUsesPerUser} usos`;
}

type TabButtonProps = {
	active: boolean;
	label: string;
	onClick: () => void;
};

function TabButton({ active, label, onClick }: TabButtonProps): ReactElement {
	return (
		<button
			type="button"
			className={[
				"flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
				active ? "bg-primary text-primary-foreground" : "bg-surface text-muted hover:text-foreground",
			].join(" ")}
			onClick={onClick}
		>
			{label}
		</button>
	);
}

export function StaffScanLoyaltyPanel({
	session,
	pendingQrValue,
	onAfterAction,
}: StaffScanLoyaltyPanelProps): ReactElement {
	const searchParams = useSearchParams();
	const router = useRouter();
	const customerId = session.customer.id;

	const initialTab: LoyaltyTab = searchParams.get("tab") === "promos" ? "promos" : "stamps";
	const [activeTab, setActiveTab] = useState<LoyaltyTab>(initialTab);
	const [loadingTarget, setLoadingTarget] = useState<LoadingTarget | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [lastOutcomes, setLastOutcomes] = useState<StaffScanOutcome[]>([]);
	const [lastCustomer, setLastCustomer] = useState<{
		name: string;
		pointsBalance: number;
		visitsCount: number;
	} | null>(null);

	const unlockEnabled = session.tenantCapabilities.roulette?.unlockEnabled ?? false;
	const showStamps = session.tenantCapabilities.stampCampaignsEnabled && session.stampCards.length > 0;
	const showPromos = session.tenantCapabilities.promotionsEnabled && session.promotions.length > 0;
	const canPerformActions = pendingQrValue !== null && pendingQrValue.trim() !== "";
	const showStampSection = showStamps && (activeTab === "stamps" || !showPromos);
	const showPromoSection = showPromos && (activeTab === "promos" || !showStamps);

	const syncTabInUrl = useCallback(
		(tab: LoyaltyTab): void => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("c", customerId);

			if (tab === "promos") {
				params.set("tab", "promos");
			} else {
				params.delete("tab");
			}

			router.replace(`/scan/session/loyalty?${params.toString()}`, { scroll: false });
		},
		[customerId, router, searchParams],
	);

	useEffect(() => {
		setActiveTab(searchParams.get("tab") === "promos" ? "promos" : "stamps");
	}, [searchParams]);

	function selectTab(tab: LoyaltyTab): void {
		setActiveTab(tab);
		syncTabInUrl(tab);
		setActionError(null);
	}

	async function runScan(
		targetType: LoadingTarget["targetType"],
		targetId: string,
	): Promise<void> {
		if (!canPerformActions || !pendingQrValue) {
			setActionError("Identifica de nuevo al cliente desde Escanear QR para registrar acciones.");

			return;
		}

		setLoadingTarget({ targetType, targetId });
		setActionError(null);
		setLastOutcomes([]);
		setLastCustomer(null);

		const result = await recordStaffScanByTarget({
			qrValue: pendingQrValue,
			targetType,
			targetId,
		});

		setLoadingTarget(null);

		if (!result.ok) {
			setActionError(result.errorMessage);

			return;
		}

		setLastOutcomes(result.outcomes);
		setLastCustomer(result.customer);
		await onAfterAction();
	}

	const isLoading = (targetType: LoadingTarget["targetType"], targetId: string): boolean =>
		loadingTarget?.targetType === targetType && loadingTarget.targetId === targetId;

	return (
		<div className="flex flex-col gap-5">
			{!canPerformActions ? (
				<div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
					Para añadir sellos o aplicar promociones necesitas identificar al cliente con su QR.{" "}
					<Link href="/scan" className="text-primary underline">
						Volver a Escanear QR
					</Link>
				</div>
			) : null}

			{unlockEnabled ? (
				<div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
					<p className="text-sm font-semibold text-foreground">Ruleta desbloqueable</p>
					<p className="mt-1 text-sm text-muted">
						Al registrar la visita en una tarjeta o promoción, el cliente puede desbloquear un giro
						en su app personal.
					</p>
				</div>
			) : null}

			{showStamps && showPromos ? (
				<div className="flex gap-2 rounded-xl border border-border bg-surface p-1">
					<TabButton
						active={activeTab === "stamps"}
						label="Tarjetas"
						onClick={() => selectTab("stamps")}
					/>
					<TabButton
						active={activeTab === "promos"}
						label="Promociones"
						onClick={() => selectTab("promos")}
					/>
				</div>
			) : null}

			{actionError ? <p className="text-sm text-error">{actionError}</p> : null}

			<StaffScanActionFeedback outcomes={lastOutcomes} customer={lastCustomer} />

			{showStampSection ? (
				<div className="flex flex-col gap-3">
					{!showStamps ? (
						<p className="text-sm text-muted">
							{session.tenantCapabilities.stampCampaignsEnabled
								? "No hay campañas de sellos activas."
								: "Las tarjetas de sellos no están disponibles en este plan."}
						</p>
					) : (
						<ul className="flex flex-col gap-3">
							{session.stampCards.map((card) => {
								const blockMessage = stampBlockMessage(card);
								const backgroundVariant = resolveLoyaltyCardBackground(
									card.cardBackgroundVariant as LoyaltyCardBackgroundVariant,
								).id;
								const busy = isLoading("stamp_campaign", card.campaignId);

								return (
									<li key={card.campaignId}>
										<LoyaltyCardBackground className="border border-border" variant={backgroundVariant}>
											<div className="flex flex-col gap-3">
												<div className="flex items-start justify-between gap-3 text-sm">
													<div className="flex min-w-0 flex-col gap-0.5">
														<span className="font-medium text-foreground">{card.campaignName}</span>
														{card.stampTypeLabel ? (
															<span className="text-xs text-muted">{card.stampTypeLabel}</span>
														) : null}
														{card.conditions?.trim() ? (
															<p className="mt-1 text-xs text-muted">{card.conditions.trim()}</p>
														) : null}
													</div>
													{card.completed ? (
														<span className="shrink-0 font-medium text-primary">Completada</span>
													) : (
														<span className="shrink-0 text-muted">
															{card.current} / {card.required}
														</span>
													)}
												</div>
												<LoyaltyProgress
													template={parseLoyaltyVisualTemplate(card.visualTemplate)}
													current={card.current}
													required={card.required}
													completed={card.completed}
												/>
												{blockMessage ? (
													<p className="text-xs text-muted">{blockMessage}</p>
												) : null}
												{card.canAddStamp ? (
													<Button
														type="button"
														className="w-full sm:w-auto"
														disabled={!canPerformActions || busy || loadingTarget !== null}
														onClick={() => void runScan("stamp_campaign", card.campaignId)}
													>
														{busy ? "Registrando…" : "Añadir sello"}
													</Button>
												) : null}
											</div>
										</LoyaltyCardBackground>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			) : null}

			{showPromoSection ? (
				<div className="flex flex-col gap-3">
					<ul className="flex flex-col gap-3">
						{session.promotions.map((promotion) => {
							const blockMessage = promotionBlockMessage(promotion);
							const usesLabel = promotionUsesLabel(promotion);
							const busy = isLoading("promotion", promotion.id);

							return (
								<li
									key={promotion.id}
									className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
								>
									<div className="flex flex-col gap-1 text-sm">
										<span className="font-medium text-foreground">{promotion.title}</span>
										{promotion.description ? (
											<span className="text-muted">{promotion.description}</span>
										) : null}
										{usesLabel ? <span className="text-xs text-muted">{usesLabel}</span> : null}
									</div>
									{blockMessage ? <p className="text-xs text-muted">{blockMessage}</p> : null}
									{promotion.canApply ? (
										<Button
											type="button"
											className="w-full sm:w-auto"
											disabled={!canPerformActions || busy || loadingTarget !== null}
											onClick={() => void runScan("promotion", promotion.id)}
										>
											{busy ? "Aplicando…" : "Aplicar promoción"}
										</Button>
									) : null}
								</li>
							);
						})}
					</ul>
				</div>
			) : null}
		</div>
	);
}
