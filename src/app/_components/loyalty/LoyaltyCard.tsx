"use client";

import QRCode from "react-qr-code";
import type { ReactElement } from "react";

import { Button } from "../ui/Button";

export type StampProgressRow = {
	campaignId: string;
	campaignName: string;
	current: number;
	required: number;
	completed: boolean;
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

type LoyaltyCardProps = {
	name: string;
	pointsBalance: number;
	qrValue: string;
	businessName?: string;
	stampProgress?: StampProgressRow[];
	rewards?: RewardRow[];
	redeemingRewardId?: string | null;
	redeemError?: string | null;
	onRedeemReward?: (rewardId: string) => void;
};

export function LoyaltyCard({
	name,
	pointsBalance,
	qrValue,
	businessName,
	stampProgress = [],
	rewards = [],
	redeemingRewardId = null,
	redeemError = null,
	onRedeemReward,
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

			{stampProgress.length > 0 ? (
				<div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
					<h2 className="text-sm font-medium text-foreground">Sellos</h2>
					<ul className="flex flex-col gap-2">
						{stampProgress.map((row) => (
							<li
								key={row.campaignId}
								className="flex items-center justify-between gap-3 text-sm"
							>
								<span className="text-foreground">{row.campaignName}</span>
								{row.completed ? (
									<span className="font-medium text-primary">Completada</span>
								) : (
									<span className="text-muted">
										{row.current} / {row.required}
									</span>
								)}
							</li>
						))}
					</ul>
				</div>
			) : null}

			<div className="mx-auto rounded-xl border border-border bg-white p-4 shadow-sm">
				<QRCode value={qrValue} size={200} level="M" />
			</div>

			<p className="text-center text-sm text-muted">
				Muestra este código QR al personal para acumular puntos.
			</p>
		</div>
	);
}
