"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "../ui/Button";
import {
	promotionsActivityBadge,
	redeemActivityBadge,
	rouletteActivityBadge,
	stampActivityBadge,
} from "./staffScanActivityBadges";
import { StaffScanSessionCustomerHeader } from "./StaffScanSessionCustomerHeader";
import type { StaffScanSessionData } from "./staffScanSessionTypes";

type StaffScanActivityHubProps = {
	session: StaffScanSessionData;
	customerId: string;
	onScanAnother: () => void;
};

type ActivityCardProps = {
	title: string;
	description: string;
	badge: string;
	href: string;
	disabled?: boolean;
	disabledReason?: string;
};

function ActivityCard({
	title,
	description,
	badge,
	href,
	disabled = false,
	disabledReason,
}: ActivityCardProps): ReactElement {
	const content = (
		<div
			className={[
				"flex flex-col gap-2 rounded-xl border bg-surface p-4 text-left transition-opacity",
				disabled ? "cursor-not-allowed border-border opacity-60" : "border-border hover:border-primary/40",
			].join(" ")}
		>
			<div className="flex items-start justify-between gap-3">
				<span className="font-medium text-foreground">{title}</span>
				<span className="shrink-0 text-xs text-muted">{badge}</span>
			</div>
			<p className="text-sm text-muted">{disabled && disabledReason ? disabledReason : description}</p>
		</div>
	);

	if (disabled) {
		return content;
	}

	return (
		<Link href={href} className="block no-underline">
			{content}
		</Link>
	);
}

export function StaffScanActivityHub({
	session,
	customerId,
	onScanAnother,
}: StaffScanActivityHubProps): ReactElement {
	const query = `c=${encodeURIComponent(customerId)}`;
	const caps = session.tenantCapabilities;
	const promoBadge = promotionsActivityBadge(session.promotions);
	const pendingCount = session.roulette?.pendingPhysicalCount ?? 0;

	const showStamps = caps.stampCampaignsEnabled && session.stampCards.length > 0;
	const showPromos = caps.promotionsEnabled && session.promotions.length > 0;
	const showRoulette = caps.roulette !== null;
	const showRedeem = caps.physicalRedeemEnabled;

	return (
		<div className="flex flex-col gap-6">
			<StaffScanSessionCustomerHeader customer={session.customer} />

			<div className="flex flex-col gap-1">
				<h2 className="text-sm font-medium text-foreground">Elige actividad</h2>
				<p className="text-xs text-muted">Gestiona sellos, promociones, ruleta o canje para este cliente.</p>
			</div>

			<div className="flex flex-col gap-3">
				{showStamps ? (
					<ActivityCard
						title="Tarjetas de sellos"
						description="Registra visitas y suma sellos en una tarjeta concreta."
						badge={stampActivityBadge(session.stampCards)}
						href={`/scan/session/loyalty?${query}`}
					/>
				) : caps.stampCampaignsEnabled ? (
					<ActivityCard
						title="Tarjetas de sellos"
						description="No hay campañas activas en este local."
						badge="Sin tarjetas"
						href={`/scan/session/loyalty?${query}`}
						disabled
						disabledReason="Activa campañas en configuración de sellos."
					/>
				) : null}

				{showPromos ? (
					<ActivityCard
						title="Promociones"
						description="Aplica una promoción activa al cliente."
						badge={promoBadge.badge}
						href={`/scan/session/loyalty?${query}&tab=promos`}
						disabled={promoBadge.applicableCount === 0}
						disabledReason="Ninguna promoción aplicable ahora."
					/>
				) : caps.promotionsEnabled ? (
					<ActivityCard
						title="Promociones"
						description="No hay promociones activas."
						badge="Sin promos"
						href={`/scan/session/loyalty?${query}`}
						disabled
						disabledReason="Crea promociones en configuración."
					/>
				) : null}

				{showRoulette ? (
					<ActivityCard
						title="Ruleta"
						description="Autoriza un giro o revisa el estado de participación."
						badge={rouletteActivityBadge(session)}
						href={`/scan/session/ruleta?${query}`}
					/>
				) : null}

				{showRedeem ? (
					<ActivityCard
						title="Canjear premio físico (ruleta)"
						description="Entrega premios físicos ya ganados en la ruleta."
						badge={redeemActivityBadge(pendingCount)}
						href={`/scan/session/redeem?${query}`}
						disabled={pendingCount === 0}
						disabledReason="Sin premios físicos pendientes de entrega."
					/>
				) : null}
			</div>

			<Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onScanAnother}>
				Escanear otro cliente
			</Button>
		</div>
	);
}
