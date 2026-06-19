"use client";

import { type ReactElement, useEffect, useState } from "react";

import {
	createInitialDraftFromSavedZone,
	type UserSearchZoneJson,
} from "../../../lib/platform/resolveSearchZoneMapInitialDraft";
import { SearchZoneMapEditor } from "./SearchZoneMapEditor";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export type { UserSearchZoneJson };

type EditorMode = "idle" | "editing";

type UserSearchZoneEditorProps = {
	savedZone: UserSearchZoneJson | null;
	onZoneSaved: (zone: UserSearchZoneJson) => void;
	initialOpen?: boolean;
};

export function UserSearchZoneEditor({
	savedZone,
	onZoneSaved,
	initialOpen = false,
}: UserSearchZoneEditorProps): ReactElement {
	const [mode, setMode] = useState<EditorMode>(initialOpen ? "editing" : "idle");
	const [editorKey, setEditorKey] = useState(0);

	useEffect(() => {
		if (!initialOpen) {
			return;
		}

		setMode("editing");
		setEditorKey((current) => current + 1);
		document.getElementById("search-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [initialOpen]);

	function openEditor(): void {
		setEditorKey((current) => current + 1);
		setMode("editing");
	}

	function cancelEditing(): void {
		setMode("idle");
	}

	function handleZoneSaved(zone: UserSearchZoneJson): void {
		onZoneSaved(zone);
		setMode("idle");
	}

	if (mode === "editing") {
		return (
			<SearchZoneMapEditor
				key={editorKey}
				savedZone={savedZone}
				initialDraft={createInitialDraftFromSavedZone(savedZone)}
				initialQuery={savedZone?.label ?? ""}
				onZoneSaved={handleZoneSaved}
				onCancel={cancelEditing}
				variant="embedded"
			/>
		);
	}

	return (
		<Card className="flex flex-col gap-3">
			{savedZone ? (
				<>
					<p className="text-sm text-muted">
						Exploras locales cerca de{" "}
						<span className="font-medium text-foreground">{savedZone.label}</span>.
					</p>
					<Button type="button" variant="secondary" className="w-full" onClick={openEditor}>
						Cambiar zona
					</Button>
				</>
			) : (
				<>
					<p className="text-sm text-muted">
						Elige dónde quieres explorar locales. Tu zona se usará en «Explorar» en lugar de
						pedirte la ubicación cada vez.
					</p>
					<Button type="button" className="w-full" onClick={openEditor}>
						Establecer zona de búsqueda
					</Button>
				</>
			)}
		</Card>
	);
}
