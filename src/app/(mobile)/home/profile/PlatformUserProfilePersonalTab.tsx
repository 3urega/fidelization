"use client";

import { type ReactElement } from "react";

import { SearchZoneProfileSummary } from "../../../_components/platform-app/SearchZoneProfileSummary";
import type { UserSearchZoneJson } from "../../../../lib/platform/resolveSearchZoneMapInitialDraft";
import { Card } from "../../../_components/ui/Card";

type PlatformUserProfilePersonalTabProps = {
	name: string;
	email: string;
	searchZone: UserSearchZoneJson | null;
};

export type { UserSearchZoneJson };

export function PlatformUserProfilePersonalTab({
	name,
	email,
	searchZone,
}: PlatformUserProfilePersonalTabProps): ReactElement {
	return (
		<div className="flex flex-col gap-4">
			<Card className="flex flex-col gap-3">
				<div>
					<p className="text-sm font-medium text-foreground">Nombre</p>
					<p className="mt-1 text-sm text-muted">{name}</p>
				</div>
				<div>
					<p className="text-sm font-medium text-foreground">Email</p>
					<p className="mt-1 text-sm text-muted">{email}</p>
				</div>
			</Card>

			<section className="flex flex-col gap-3">
				<h2 className="text-sm font-medium text-foreground">Zona de búsqueda</h2>
				<SearchZoneProfileSummary searchZone={searchZone} />
			</section>
		</div>
	);
}
