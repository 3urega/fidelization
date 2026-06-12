"use client";

import QRCode from "react-qr-code";
import type { ReactElement } from "react";

import { Button } from "../ui/Button";
import { QrDevScanHint } from "./QrDevScanHint";
import type { LoyaltyCardBackgroundVariant } from "./loyaltyCardBackgrounds";
import { StampCampaignCards } from "./StampCampaignCards";

export type StampProgressRow = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
	stampTypeId?: string | null;
	stampTypeLabel?: string;
	visualTemplate?: string | null;
	cardBackgroundVariant?: LoyaltyCardBackgroundVariant | string | null;
};

export type RewardRow = {
	id: string;
	name: string;
	description: string;
	costPoints: number;
	type: string;
	isActive: boolean;
	stockLimit: number | null;
};

export type PromotionRow = {
	id: string;
	title: string;
	description: string;
	type: string;
	startDate: string | null;
	endDate: string | null;
	isActive: boolean;
};

const PROMOTION_TYPE_LABELS: Record<string, string> = {
	discount: "Descuento",
	bundle: "Pack / combo",
	seasonal: "Temporada",
};

function formatPromotionType(type: string): string {
	return PROMOTION_TYPE_LABELS[type] ?? type;
}

function formatPromotionDates(startDate: string | null, endDate: string | null): string | null {
	if (!startDate && !endDate) {
		return null;
	}

	const format = (value: string): string => value.slice(0, 10);

	if (startDate && endDate) {
		return `${format(startDate)} — ${format(endDate)}`;
	}

	return startDate ? `Desde ${format(startDate)}` : `Hasta ${format(endDate ?? "")}`;
}

type LoyaltyCardProps = {
	name: string;
	pointsBalance: number;
	qrValue: string;
	businessName?: string;
	stampProgress?: StampProgressRow[];
	rewards?: RewardRow[];
	promotions?: PromotionRow[];
	redeemingRewardId?: string | null;
	redeemError?: string | null;
	onRedeemReward?: (rewardId: string) => void;
	/** Background variant from `cardBackgroundVariant` (`fondo_tarjetas*.png`). */
	cardBackgroundVariant?: LoyaltyCardBackgroundVariant | null;
	/** When false, hides QR block (e.g. platform establishment detail). */
	showQr?: boolean;
};

export function LoyaltyCard({
	name,
	pointsBalance,
	qrValue,
	businessName,
	stampProgress = [],
	rewards = [],
	promotions = [],
	redeemingRewardId = null,
	redeemError = null,
	onRedeemReward,
	cardBackgroundVariant = "coffee-photo",
	showQr = true,
}: LoyaltyCardProps): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			{businessName ? (
				<p className="text-center text-sm font-medium uppercase tracking-wide text-muted">
					{businessName}
				</p>
			) : null}

			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="text-2xl font-semibold text-foreground">{name}</h1>
				<p className="text-4xl font-bold text-primary">{pointsBalance}</p>
				<p className="text-sm text-muted">puntos</p>
			</div>

			{rewards.length > 0 ? (
				<div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
					<h2 className="text-sm font-medium text-foreground">Recompensas</h2>
					{redeemError ? <p className="text-sm text-error">{redeemError}</p> : null}
					<ul className="flex flex-col gap-3">
						{rewards.map((reward) => {
							const canRedeem = pointsBalance >= reward.costPoints;
							const isRedeeming = redeemingRewardId === reward.id;

							return (
								<li
									key={reward.id}
									className="flex items-center justify-between gap-3 text-sm"
								>
									<div className="flex min-w-0 flex-col gap-0.5">
										<span className="text-foreground">{reward.name}</span>
										<span className="text-muted">{reward.costPoints} puntos</span>
									</div>
									<Button
										type="button"
										className="shrink-0"
										disabled={!canRedeem || isRedeeming || !onRedeemReward}
										onClick={() => onRedeemReward?.(reward.id)}
									>
										{isRedeeming ? "Canjeando…" : "Canjear"}
									</Button>
								</li>
							);
						})}
					</ul>
				</div>
			) : null}

			{promotions.length > 0 ? (
				<div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
					<h2 className="text-sm font-medium text-foreground">Promociones</h2>
					<ul className="flex flex-col gap-3">
						{promotions.map((promotion) => {
							const dateRange = formatPromotionDates(promotion.startDate, promotion.endDate);

							return (
								<li key={promotion.id} className="flex flex-col gap-0.5 text-sm">
									<span className="font-medium text-foreground">{promotion.title}</span>
									<span className="text-muted">{promotion.description}</span>
									<span className="text-xs text-muted">
										{formatPromotionType(promotion.type)}
										{dateRange ? ` · ${dateRange}` : null}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			) : null}

			{stampProgress.length > 0 ? (
				<StampCampaignCards rows={stampProgress} cardBackgroundVariant={cardBackgroundVariant} />
			) : null}

			{showQr ? (
				<>
					<div className="mx-auto flex flex-col items-center gap-3">
						<div className="rounded-xl border border-border bg-white p-4 shadow-sm">
							<QRCode value={qrValue} size={200} level="M" />
						</div>
						<QrDevScanHint qrValue={qrValue} />
					</div>

					<p className="text-center text-sm text-muted">
						Muestra este código QR al personal para acumular puntos.
					</p>
				</>
			) : null}
		</div>
	);
}
