"use client";

import Link from "next/link";
import { type ReactElement } from "react";

import {
	formatSpinHistoryDate,
	formatSpinRedeemStatus,
	isStaffExplicitRoulette,
	roulettePrimaryAction,
	roulettePrimaryCtaLabel,
	rouletteStatusMessage,
	type RoulettePublicStateResponse,
} from "../../../../lib/roulette/roulettePublicStateClient";
import { platformRoutes } from "../../../../lib/platform/routes";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";

type RouletteParticipationCardProps = {
	slug: string;
	state: RoulettePublicStateResponse;
	enrolling?: boolean;
	onEnroll?: () => Promise<void>;
	showHistory?: boolean;
	showSegments?: boolean;
	hideCta?: boolean;
};

export function RouletteParticipationCard({
	slug,
	state,
	enrolling = false,
	onEnroll,
	showHistory = false,
	showSegments = false,
	hideCta = false,
}: RouletteParticipationCardProps): ReactElement | null {
	if (!state.isEnabled && !isStaffExplicitRoulette(state)) {
		return null;
	}

	const primaryAction = roulettePrimaryAction(state);
	const message = rouletteStatusMessage(state);
	const ctaLabel = roulettePrimaryCtaLabel(state);
	const ruletaHref = platformRoutes.homeEstablishmentRoulette(slug);

	return (
		<Card>
			<div className="flex flex-col gap-3">
				<div>
					<h2 className="text-sm font-medium text-foreground">Ruleta de premios</h2>
					<p className="mt-1 text-sm text-muted">{message}</p>
					{isStaffExplicitRoulette(state) &&
					state.participationStatus &&
					["active", "authorized_ready", "quota_exhausted"].includes(state.participationStatus) ? (
						<p className="mt-2 text-xs text-muted">
							Hoy: {state.spinsRemainingToday ?? 0} de{" "}
							{(state.spinsRemainingToday ?? 0) + (state.spinsUsedToday ?? 0)} giros restantes
						</p>
					) : null}
				</div>

				{showSegments && state.segments.length > 0 ? (
					<div>
						<h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Premios posibles
						</h3>
						<ul className="mt-2 flex flex-wrap gap-2">
							{state.segments.map((segment) => (
								<li
									key={segment.id}
									className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
								>
									{segment.label}
								</li>
							))}
						</ul>
					</div>
				) : null}

				{showHistory && state.recentSpins && state.recentSpins.length > 0 ? (
					<div>
						<h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Últimos giros
						</h3>
						<ul className="mt-2 flex flex-col gap-2">
							{state.recentSpins.map((spin) => (
								<li
									key={spin.spinId}
									className="rounded-lg border border-border px-3 py-2 text-sm"
								>
									<div className="flex items-start justify-between gap-2">
										<div>
											<p className="font-medium text-foreground">{spin.segmentLabel}</p>
											<p className="text-xs text-muted">{spin.prizeSummary}</p>
										</div>
										<span className="shrink-0 text-xs text-muted">
											{formatSpinHistoryDate(spin.createdAt)}
										</span>
									</div>
									{spin.prizeType === "physical" ? (
										<p className="mt-1 text-xs text-muted">
											{formatSpinRedeemStatus(spin.status)}
										</p>
									) : null}
								</li>
							))}
						</ul>
					</div>
				) : null}

				{hideCta ? null : primaryAction === "enroll" ? (
					<Button
						type="button"
						className="w-full"
						disabled={enrolling}
						onClick={() => {
							void onEnroll?.();
						}}
					>
						{enrolling ? "Activando…" : ctaLabel}
					</Button>
				) : primaryAction === "navigate" ? (
					<Link href={ruletaHref} className="w-full">
						<Button
							type="button"
							className="w-full"
							variant={state.canSpin ? "primary" : "secondary"}
						>
							{ctaLabel}
						</Button>
					</Link>
				) : null}
			</div>
		</Card>
	);
}
