import Link from "next/link";
import { type ReactElement } from "react";

import { resolveTenantDiscoveryTagLabel } from "../../../contexts/tenants/tenants/domain/TenantDiscoveryTag";
import { resolveTenantCoverImageUrl } from "../../../lib/platform/tenantDiscoveryAssets";
import { platformRoutes } from "../../../lib/platform/routes";

export type DiscoverEstablishment = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	coverImageUrl?: string | null;
	tags?: string[];
};

type EstablishmentDiscoverCardProps = {
	establishment: DiscoverEstablishment;
};

const MAX_VISIBLE_TAGS = 3;

export function EstablishmentDiscoverCard({
	establishment,
}: EstablishmentDiscoverCardProps): ReactElement {
	const coverUrl = resolveTenantCoverImageUrl(establishment.coverImageUrl);
	const tags = establishment.tags ?? [];
	const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
	const hiddenTagCount = tags.length - visibleTags.length;

	return (
		<Link
			href={platformRoutes.homeEstablishment(establishment.slug)}
			className="group block overflow-hidden rounded-theme focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
		>
			<div className="relative aspect-square overflow-hidden rounded-theme border border-border bg-surface">
				<img
					src={coverUrl}
					alt=""
					className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

				<div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3">
					<p className="text-center text-sm font-semibold leading-snug text-foreground">
						{establishment.name}
					</p>
					{visibleTags.length > 0 ? (
						<ul className="flex flex-wrap justify-center gap-1">
							{visibleTags.map((tagId) => (
								<li
									key={tagId}
									className="rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium text-foreground"
								>
									{resolveTenantDiscoveryTagLabel(tagId)}
								</li>
							))}
							{hiddenTagCount > 0 ? (
								<li className="rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium text-muted">
									+{hiddenTagCount}
								</li>
							) : null}
						</ul>
					) : null}
				</div>
			</div>
		</Link>
	);
}
