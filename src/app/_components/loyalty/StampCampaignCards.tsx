import type { ReactElement } from "react";

import { LoyaltyCardBackground } from "./LoyaltyCardBackground";
import type { LoyaltyCardBackgroundVariant } from "./loyaltyCardBackgrounds";
import { LoyaltyProgress } from "./LoyaltyProgress";
import { resolveLoyaltyCardBackground } from "./loyaltyCardBackgrounds";
import { parseLoyaltyVisualTemplate } from "./loyaltyVisualTemplates";
import type { StampProgressRow } from "./LoyaltyCard";

type StampCampaignCardsProps = {
	rows: StampProgressRow[];
	/** When true, shows empty progress slots and preview copy (discovery mode). */
	preview?: boolean;
	title?: string;
	previewSubtitle?: string;
	emptyMessage?: string;
	cardBackgroundVariant?: LoyaltyCardBackgroundVariant | null;
};

export function StampCampaignCards({
	rows,
	preview = false,
	title = "Sellos",
	previewSubtitle = "Únete para empezar a acumular sellos.",
	emptyMessage = "Este local no tiene campañas de sellos activas.",
	cardBackgroundVariant = "coffee-photo",
}: StampCampaignCardsProps): ReactElement | null {
	if (rows.length === 0) {
		return <p className="text-sm text-muted">{emptyMessage}</p>;
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<h2 className="text-lg font-semibold text-foreground">{title}</h2>
				{preview && previewSubtitle ? (
					<p className="text-sm text-muted">{previewSubtitle}</p>
				) : null}
			</div>
			<ul className="flex flex-col gap-3">
				{rows.map((row) => {
					const current = preview ? 0 : row.current;
					const completed = preview ? false : row.completed;

					return (
						<li key={row.campaignId}>
							<LoyaltyCardBackground
								className="border-2 border-white"
								variant={
									resolveLoyaltyCardBackground(
										(row.cardBackgroundVariant as LoyaltyCardBackgroundVariant | null) ??
											cardBackgroundVariant,
									).id
								}
							>
								<div className="flex flex-col gap-3">
									<div className="flex items-start justify-between gap-3 text-sm">
										<div className="flex min-w-0 flex-col gap-0.5">
											<span className="font-medium text-foreground">{row.campaignName}</span>
											{row.stampTypeLabel ? (
												<span className="text-xs text-muted">{row.stampTypeLabel}</span>
											) : null}
											{row.conditions?.trim() ? (
												<p className="mt-1 text-xs text-muted">{row.conditions.trim()}</p>
											) : null}
										</div>
										{completed ? (
											<span className="shrink-0 font-medium text-primary">Completada</span>
										) : (
											<span className="shrink-0 text-muted">
												{current} / {row.required}
											</span>
										)}
									</div>
									<LoyaltyProgress
										template={parseLoyaltyVisualTemplate(row.visualTemplate)}
										current={current}
										required={row.required}
										completed={completed}
									/>
								</div>
							</LoyaltyCardBackground>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
