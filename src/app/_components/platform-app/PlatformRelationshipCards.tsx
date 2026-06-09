import Link from "next/link";
import { type ReactElement } from "react";

import { Card } from "../ui/Card";
import { platformRoutes } from "../../../lib/platform/routes";

type UserBusiness = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	subscriptionPlan: string;
	status: string;
};

function planLabel(plan: string): string {
	return plan.charAt(0).toUpperCase() + plan.slice(1);
}

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

export function BusinessSummaryCard({ business }: { business: UserBusiness }): ReactElement {
	return (
		<Link href={platformRoutes.homeBusiness(business.slug)} className="block">
			<Card className="transition-opacity hover:opacity-90">
				<div className="flex items-start gap-3">
					<BusinessAvatar name={business.name} logoUrl={business.logoUrl} />
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<p className="font-medium text-foreground">{business.name}</p>
						<p className="text-xs text-muted">{business.slug}</p>
						<div className="flex flex-wrap gap-2 pt-1">
							<span className="rounded-theme bg-muted/30 px-2 py-0.5 text-xs text-muted">
								Plan {planLabel(business.subscriptionPlan)}
							</span>
							<span className="rounded-theme bg-muted/30 px-2 py-0.5 text-xs capitalize text-muted">
								{business.status}
							</span>
						</div>
					</div>
				</div>
			</Card>
		</Link>
	);
}

type UserEstablishment = {
	customerId: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	pointsBalance: number;
	visitsCount: number;
};

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
						href={platformRoutes.homeDiscover}
						className="text-center text-sm font-medium text-primary hover:opacity-80"
					>
						Descubrir locales
					</Link>
				</div>
			</div>
		</Card>
	);
}
