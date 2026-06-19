"use client";

import { type ReactElement, useState } from "react";

import { UserSearchZoneEditor, type UserSearchZoneJson } from "../../../_components/platform-app/UserSearchZoneEditor";
import { Card } from "../../../_components/ui/Card";

type PlatformUserProfilePersonalTabProps = {
	name: string;
	email: string;
	searchZone: UserSearchZoneJson | null;
	onSearchZoneSaved: (zone: UserSearchZoneJson) => void;
	initialEditorOpen?: boolean;
};

export type { UserSearchZoneJson };

export function PlatformUserProfilePersonalTab({
	name,
	email,
	searchZone,
	onSearchZoneSaved,
	initialEditorOpen = false,
}: PlatformUserProfilePersonalTabProps): ReactElement {
	const [editorOpenFromHash] = useState(
		() => typeof window !== "undefined" && window.location.hash === "#search-zone",
	);

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

			<section id="search-zone" className="flex flex-col gap-3 scroll-mt-4">
				<h2 className="text-sm font-medium text-foreground">Zona de búsqueda</h2>

				<UserSearchZoneEditor
					savedZone={searchZone}
					onZoneSaved={onSearchZoneSaved}
					initialOpen={initialEditorOpen || editorOpenFromHash}
				/>
			</section>
		</div>
	);
}
