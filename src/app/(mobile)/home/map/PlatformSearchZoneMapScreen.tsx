"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import { SearchZoneMapEditor } from "../../../_components/platform-app/SearchZoneMapEditor";
import { platformFetch } from "../../../../lib/platform/apiUrl";
import {
	resolveSearchZoneMapInitialDraft,
	type SearchZoneDraft,
	type UserSearchZoneJson,
} from "../../../../lib/platform/resolveSearchZoneMapInitialDraft";
import { requestUserLocation } from "../../../../lib/platform/requestUserLocation";
import { platformRoutes } from "../../../../lib/platform/routes";

type UserMeResponse = {
	user: {
		searchZone: UserSearchZoneJson | null;
	};
	kind: "user";
};

type MapScreenReadyState = {
	savedZone: UserSearchZoneJson | null;
	initialDraft: SearchZoneDraft;
	initialQuery: string;
	locationHint: string | null;
};

export function PlatformSearchZoneMapScreen(): ReactElement {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [readyState, setReadyState] = useState<MapScreenReadyState | null>(null);
	const [savedZone, setSavedZone] = useState<UserSearchZoneJson | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			const [meResponse, gpsResult] = await Promise.all([
				platformFetch("/api/user/me"),
				requestUserLocation().catch(() => null),
			]);

			if (cancelled) {
				return;
			}

			if (!meResponse.ok) {
				setError("No se pudo cargar tu perfil");
				setLoading(false);
				return;
			}

			const data = (await meResponse.json()) as UserMeResponse;
			const zone = data.user.searchZone;
			const initialDraft = resolveSearchZoneMapInitialDraft(gpsResult, zone);

			setSavedZone(zone);
			setReadyState({
				savedZone: zone,
				initialDraft,
				initialQuery: gpsResult ? "" : (zone?.label ?? initialDraft.label),
				locationHint: gpsResult
					? "Centrado en tu ubicación actual."
					: zone
						? `Centrado en ${zone.label}.`
						: null,
			});
			setError(null);
			setLoading(false);
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	function handleZoneSaved(zone: UserSearchZoneJson): void {
		setSavedZone(zone);
		setReadyState((current) =>
			current
				? {
						...current,
						savedZone: zone,
						locationHint: `Centrado en ${zone.label}.`,
					}
				: current,
		);
	}

	if (loading) {
		return (
			<main className="flex flex-1 flex-col gap-6 py-4">
				<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
					← Volver al inicio
				</Link>
				<header className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold text-foreground">Mapa</h1>
					<p className="text-sm text-muted">Obteniendo ubicación…</p>
				</header>
			</main>
		);
	}

	if (error || !readyState) {
		return (
			<main className="flex flex-1 flex-col gap-4 py-4">
				<p className="text-sm text-error">{error ?? "No se pudo cargar el mapa"}</p>
				<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
					← Volver al inicio
				</Link>
			</main>
		);
	}

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold text-foreground">Mapa</h1>
				{readyState.locationHint ? (
					<p className="text-sm text-muted">{readyState.locationHint}</p>
				) : (
					<p className="text-sm text-muted">Explora locales y establece tu zona de búsqueda.</p>
				)}
			</header>

			<SearchZoneMapEditor
				savedZone={savedZone}
				initialDraft={readyState.initialDraft}
				initialQuery={readyState.initialQuery}
				onZoneSaved={handleZoneSaved}
				onCancel={() => router.push(platformRoutes.home)}
				variant="page"
			/>
		</main>
	);
}
