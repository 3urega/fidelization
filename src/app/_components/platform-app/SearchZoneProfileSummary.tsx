import Link from "next/link";
import { type ReactElement } from "react";

import type { UserSearchZoneJson } from "../../../lib/platform/resolveSearchZoneMapInitialDraft";
import { platformRoutes } from "../../../lib/platform/routes";
import { Card } from "../ui/Card";

type SearchZoneProfileSummaryProps = {
	searchZone: UserSearchZoneJson | null;
};

export function SearchZoneProfileSummary({
	searchZone,
}: SearchZoneProfileSummaryProps): ReactElement {
	return (
		<Card className="flex flex-col gap-3">
			{searchZone ? (
				<>
					<p className="text-sm text-muted">
						Zona de referencia:{" "}
						<span className="font-medium text-foreground">{searchZone.label}</span>
					</p>
					<p className="text-sm text-muted">
						El grid «Explorar» ordena los locales por distancia desde esta zona.
					</p>
					<Link
						href={platformRoutes.homeMap}
						className="text-sm font-medium text-primary underline hover:opacity-90"
					>
						Cambiar en el mapa
					</Link>
				</>
			) : (
				<>
					<p className="text-sm text-muted">
						Establece dónde quieres explorar locales. Tu zona se usará para ordenar
						«Explorar» por distancia.
					</p>
					<Link
						href={platformRoutes.homeMap}
						className="text-sm font-medium text-primary underline hover:opacity-90"
					>
						Establecer zona en el mapa
					</Link>
				</>
			)}
		</Card>
	);
}
