"use client";

import Link from "next/link";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { LoyaltyCardBackground } from "./LoyaltyCardBackground";
import type { LoyaltyCardBackgroundVariant } from "./loyaltyCardBackgrounds";
import { resolveLoyaltyCardBackground } from "./loyaltyCardBackgrounds";
import { LoyaltyProgress } from "./LoyaltyProgress";
import { parseLoyaltyVisualTemplate } from "./loyaltyVisualTemplates";

export type StaffScanSelectedTarget = {
	targetType: "stamp_campaign" | "promotion";
	targetId: string;
};

type StaffScanCampaignTarget = {
	id: string;
	name: string;
	requiredStamps: number;
	visualTemplate: string;
	cardBackgroundVariant: string;
	stampTypeLabel: string;
	conditions: string;
};

type StaffScanPromotionTarget = {
	id: string;
	title: string;
	description: string;
	maxUsesPerUser: number | null;
};

type ScanTargetsResponse = {
	stampCampaigns?: StaffScanCampaignTarget[];
	promotions?: StaffScanPromotionTarget[];
	error?: { description?: string };
};

type StaffScanTargetPickerProps = {
	selectedTarget: StaffScanSelectedTarget | null;
	onSelectTarget: (target: StaffScanSelectedTarget) => void;
	disabled?: boolean;
};

function isSelected(
	selected: StaffScanSelectedTarget | null,
	targetType: StaffScanSelectedTarget["targetType"],
	targetId: string,
): boolean {
	return selected?.targetType === targetType && selected.targetId === targetId;
}

function selectionBorderClass(selected: boolean): string {
	return selected
		? "border-2 border-primary ring-2 ring-primary/30"
		: "border border-border";
}

export function StaffScanTargetPicker({
	selectedTarget,
	onSelectTarget,
	disabled = false,
}: StaffScanTargetPickerProps): ReactElement {
	const [campaigns, setCampaigns] = useState<StaffScanCampaignTarget[]>([]);
	const [promotions, setPromotions] = useState<StaffScanPromotionTarget[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadTargets = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/loyalty/scan/targets", {
				credentials: "include",
			});
			const body = (await response.json()) as ScanTargetsResponse;

			if (!response.ok) {
				setCampaigns([]);
				setPromotions([]);
				setError(body.error?.description ?? "No se pudieron cargar las tarjetas.");

				return;
			}

			setCampaigns(body.stampCampaigns ?? []);
			setPromotions(body.promotions ?? []);
		} catch {
			setCampaigns([]);
			setPromotions([]);
			setError("Error de red al cargar tarjetas y promociones.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadTargets();
	}, [loadTargets]);

	if (loading) {
		return <p className="text-sm text-muted">Cargando tarjetas y promociones…</p>;
	}

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (campaigns.length === 0 && promotions.length === 0) {
		return (
			<div className="flex flex-col gap-2">
				<p className="text-sm text-muted">No hay tarjetas ni promociones activas.</p>
				<p className="text-xs text-muted">
					Crea campañas en{" "}
					<Link href="/settings/stamps" className="text-primary underline">
						Configuración de sellos
					</Link>
					.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-1">
				<h2 className="text-sm font-medium text-foreground">Elige tarjeta o promoción</h2>
				<p className="text-xs text-muted">
					El progreso del cliente se actualiza al escanear. Selecciona una opción antes de
					introducir el QR.
				</p>
			</div>

			{campaigns.length > 0 ? (
				<ul className="flex flex-col gap-3">
					{campaigns.map((campaign) => {
						const selected = isSelected(selectedTarget, "stamp_campaign", campaign.id);
						const backgroundVariant = resolveLoyaltyCardBackground(
							campaign.cardBackgroundVariant as LoyaltyCardBackgroundVariant,
						).id;

						return (
							<li key={campaign.id}>
								<button
									type="button"
									disabled={disabled}
									className="w-full rounded-xl text-left transition-opacity disabled:opacity-60"
									onClick={() =>
										onSelectTarget({
											targetType: "stamp_campaign",
											targetId: campaign.id,
										})
									}
								>
									<LoyaltyCardBackground
										className={selectionBorderClass(selected)}
										variant={backgroundVariant}
									>
										<div className="flex flex-col gap-3">
											<div className="flex items-start justify-between gap-3 text-sm">
												<div className="flex min-w-0 flex-col gap-0.5">
													<span className="font-medium text-foreground">{campaign.name}</span>
													{campaign.stampTypeLabel ? (
														<span className="text-xs text-muted">
															{campaign.stampTypeLabel}
														</span>
													) : null}
													{campaign.conditions?.trim() ? (
														<p className="mt-1 text-xs text-muted">
															{campaign.conditions.trim()}
														</p>
													) : null}
												</div>
												<span className="shrink-0 text-muted">
													0 / {campaign.requiredStamps}
												</span>
											</div>
											<LoyaltyProgress
												template={parseLoyaltyVisualTemplate(campaign.visualTemplate)}
												current={0}
												required={campaign.requiredStamps}
												completed={false}
											/>
										</div>
									</LoyaltyCardBackground>
								</button>
							</li>
						);
					})}
				</ul>
			) : null}

			{promotions.length > 0 ? (
				<div className="flex flex-col gap-3">
					<h3 className="text-sm font-medium text-foreground">Promociones</h3>
					<ul className="flex flex-col gap-3">
						{promotions.map((promotion) => {
							const selected = isSelected(selectedTarget, "promotion", promotion.id);

							return (
								<li key={promotion.id}>
									<button
										type="button"
										disabled={disabled}
										className={[
											"w-full rounded-xl border bg-surface p-4 text-left transition-opacity disabled:opacity-60",
											selectionBorderClass(selected),
										].join(" ")}
										onClick={() =>
											onSelectTarget({
												targetType: "promotion",
												targetId: promotion.id,
											})
										}
									>
										<div className="flex flex-col gap-1 text-sm">
											<span className="font-medium text-foreground">{promotion.title}</span>
											<span className="text-muted">{promotion.description}</span>
											{promotion.maxUsesPerUser !== null ? (
												<span className="text-xs text-muted">
													Hasta {promotion.maxUsesPerUser} usos por cliente
												</span>
											) : null}
										</div>
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			) : null}
		</div>
	);
}
