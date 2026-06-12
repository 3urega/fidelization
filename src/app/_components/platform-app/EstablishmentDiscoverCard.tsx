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
					className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-300 group-hover:scale-110"
				/>

				{visibleTags.length > 0 ? (
					<ul className="absolute inset-x-0 top-0 z-10 flex flex-wrap gap-1 p-2">
						{visibleTags.map((tagId) => (
							<li
								key={tagId}
								className="rounded-full bg-black/85 px-2 py-0.5 text-[10px] font-medium text-white"
							>
								{resolveTenantDiscoveryTagLabel(tagId)}
							</li>
						))}
						{hiddenTagCount > 0 ? (
							<li className="rounded-full bg-black/85 px-2 py-0.5 text-[10px] font-medium text-white">
								+{hiddenTagCount}
							</li>
						) : null}
					</ul>
				) : null}

				<div className="absolute inset-x-0 bottom-0 z-10 p-2">
					<div className="rounded-theme bg-foreground/75 px-3 py-2 backdrop-blur-md">
						<p className="text-center text-sm font-semibold leading-snug text-background">
							{establishment.name}
						</p>
					</div>
				</div>
			</div>
		</Link>
	);
}
