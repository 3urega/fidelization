import Link from "next/link";
import { type ReactElement } from "react";

import { platformRoutes } from "../../../lib/platform/routes";

export type DiscoverEstablishment = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
};

type EstablishmentDiscoverCardProps = {
	establishment: DiscoverEstablishment;
};

export function EstablishmentDiscoverCard({
	establishment,
}: EstablishmentDiscoverCardProps): ReactElement {
	const initial = establishment.name.charAt(0).toUpperCase() || "?";

	return (
		<Link
			href={platformRoutes.homeEstablishment(establishment.slug)}
			className="group block overflow-hidden rounded-theme focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
		>
			<div className="relative aspect-square overflow-hidden rounded-theme border border-border bg-surface">
				{establishment.logoUrl ? (
					<>
						<img
							src={establishment.logoUrl}
							alt=""
							className="absolute inset-0 h-full w-full scale-110 object-cover blur-md transition-transform duration-300 group-hover:scale-125"
						/>
						<div className="absolute inset-0 bg-background/50" aria-hidden />
					</>
				) : (
					<div
						className="absolute inset-0 flex items-center justify-center bg-primary/15"
						aria-hidden
					>
						<span className="select-none text-5xl font-bold text-primary/25">{initial}</span>
					</div>
				)}

				<div className="absolute inset-0 flex items-center justify-center p-3">
					<p className="text-center text-sm font-semibold leading-snug text-foreground drop-shadow-sm">
						{establishment.name}
					</p>
				</div>
			</div>
		</Link>
	);
}
