import type { CSSProperties, ReactElement } from "react";

import { resolveTenantCoverImageUrl } from "../../../lib/platform/tenantDiscoveryAssets";

type EstablishmentHeroCoverProps = {
	name: string;
	logoUrl: string | null;
	coverImageUrl?: string | null;
	primaryColor?: string | null;
};

function tenantAccentStyle(primaryColor: string | null | undefined): CSSProperties | undefined {
	if (!primaryColor) {
		return undefined;
	}

	return { ["--color-primary" as string]: primaryColor };
}

export function EstablishmentHeroCover({
	name,
	logoUrl,
	coverImageUrl,
	primaryColor,
}: EstablishmentHeroCoverProps): ReactElement {
	const coverUrl = resolveTenantCoverImageUrl(coverImageUrl);

	return (
		<header
			className="relative aspect-[16/9] overflow-hidden rounded-theme border border-border"
			style={tenantAccentStyle(primaryColor)}
		>
			<img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
			<div className="absolute inset-0 bg-foreground/40" aria-hidden />

			<div className="absolute inset-0 flex flex-col items-center justify-end gap-3 p-4 pb-5">
				{logoUrl ? (
					<img
						src={logoUrl}
						alt=""
						className="h-16 w-16 rounded-theme border-2 border-background object-cover shadow-md"
					/>
				) : (
					<div
						aria-hidden
						className="flex h-16 w-16 items-center justify-center rounded-theme border-2 border-background bg-surface text-xl font-semibold text-primary shadow-md"
					>
						{name.charAt(0).toUpperCase()}
					</div>
				)}

				<div className="w-full max-w-sm rounded-theme bg-foreground/75 px-4 py-2 backdrop-blur-md">
					<h1 className="text-center text-lg font-semibold leading-snug text-background">{name}</h1>
				</div>
			</div>
		</header>
	);
}
