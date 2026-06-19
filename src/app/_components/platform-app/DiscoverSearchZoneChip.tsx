import Link from "next/link";
import { type ReactElement } from "react";

import { platformRoutes } from "../../../lib/platform/routes";

type DiscoverSearchZoneChipProps = {
	label: string;
	href?: string;
};

export function DiscoverSearchZoneChip({
	label,
	href = platformRoutes.homeMap,
}: DiscoverSearchZoneChipProps): ReactElement {
	return (
		<Link
			href={href}
			className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:opacity-90"
		>
			<span className="truncate">Cerca de {label}</span>
			<span aria-hidden>·</span>
			<span className="shrink-0 underline">Editar</span>
		</Link>
	);
}
