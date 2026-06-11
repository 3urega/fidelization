import Link from "next/link";
import { type ReactElement } from "react";

import { platformRoutes } from "../../../lib/platform/routes";
import { Card } from "../ui/Card";
import { formatStampProgressLine } from "./formatStampProgressLine";

type UserEstablishment = {
	customerId: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	pointsBalance: number;
	visitsCount: number;
	stampProgress: {
		campaignId: string;
		campaignName: string;
		current: number;
		required: number;
		completed: boolean;
	}[];
};

function BusinessAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }): ReactElement {
	if (logoUrl) {
		return (
			<img
				src={logoUrl}
				alt=""
				className="h-10 w-10 rounded-theme border border-border object-cover"
			/>
		);
	}

	return (
		<div
			aria-hidden
			className="flex h-10 w-10 items-center justify-center rounded-theme border border-border bg-background text-sm font-semibold text-primary"
		>
			{name.charAt(0).toUpperCase()}
		</div>
	);
}

export function EstablishmentSummaryCard({
	establishment,
}: {
	establishment: UserEstablishment;
}): ReactElement {
	return (
		<Link href={platformRoutes.homeEstablishment(establishment.slug)} className="block">
			<Card className="transition-opacity hover:opacity-90">
				<div className="flex items-start gap-3">
					<BusinessAvatar name={establishment.name} logoUrl={establishment.logoUrl} />
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<p className="font-medium text-foreground">{establishment.name}</p>
						{establishment.stampProgress.length > 0 ? (
							<ul className="flex flex-col gap-0.5">
								{establishment.stampProgress.map((row) => (
									<li key={row.campaignId} className="text-xs text-muted">
										{formatStampProgressLine(row)}
									</li>
								))}
							</ul>
						) : null}
						<p className="text-xs text-muted">
							{establishment.pointsBalance} pts · {establishment.visitsCount} visitas
						</p>
					</div>
				</div>
			</Card>
		</Link>
	);
}

export function DualEmptyRelationshipsCard(): ReactElement {
	return (
		<Card>
			<div className="flex flex-col gap-4">
				<p className="text-sm text-muted">
					Aún no tienes negocios ni locales vinculados. Registra tu negocio o escanea un QR en un
					establecimiento para empezar.
				</p>
				<div className="flex flex-col gap-2">
					<Link
						href={platformRoutes.registerBusiness}
						className="text-center text-sm font-medium text-primary hover:opacity-80"
					>
						Registrar negocio
					</Link>
					<Link
						href={platformRoutes.homeTab("explore")}
						className="text-center text-sm font-medium text-primary hover:opacity-80"
					>
						Explorar locales
					</Link>
					<Link
						href={platformRoutes.homeTab("locales")}
						className="text-center text-sm font-medium text-primary hover:opacity-80"
					>
						Unirse por identificador
					</Link>
				</div>
			</div>
		</Card>
	);
}
