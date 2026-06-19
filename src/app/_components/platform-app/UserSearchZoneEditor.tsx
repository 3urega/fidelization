"use client";

import { type ReactElement, useEffect, useRef, useState } from "react";

import {
	DEFAULT_SEARCH_ZONE_MAP_CENTER,
	mapLatLngNearlyEqual,
} from "../../../lib/maps/mapCenterUtils";
import { platformFetch, resolvePlatformApiUrl } from "../../../lib/platform/apiUrl";
import { InteractiveSearchZoneMap } from "./maps/InteractiveSearchZoneMap";
import { useInteractiveMapClientConfig } from "./maps/useInteractiveMapClientConfig";
import type { MapLatLng } from "./maps/types";
import { SearchZoneSuggestionsList } from "./search-zone/SearchZoneSuggestionsList";
import {
	useSearchZoneSuggestions,
	type SearchZonePlaceSuggestion,
} from "./search-zone/useSearchZoneSuggestions";
import { useNearbyEstablishmentMarkers } from "./search-zone/useNearbyEstablishmentMarkers";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

export type UserSearchZoneJson = {
	label: string;
	latitude: number;
	longitude: number;
	updatedAt: string;
};

type EditorMode = "idle" | "editing";

type DraftZone = {
	label: string;
	latitude: number;
	longitude: number;
};

type UserSearchZoneEditorProps = {
	savedZone: UserSearchZoneJson | null;
	onZoneSaved: (zone: UserSearchZoneJson) => void;
	initialOpen?: boolean;
};

function buildMapPreviewUrl(latitude: number, longitude: number): string {
	const params = new URLSearchParams({
		latitude: String(latitude),
		longitude: String(longitude),
	});

	return resolvePlatformApiUrl(`/api/user/search-zone/map-preview?${params.toString()}`);
}

function geocodeErrorMessage(status: number, body: { error?: { description?: string } }): string {
	if (status === 503) {
		return "El servicio de ubicación no está disponible. Inténtalo más tarde.";
	}

	if (status === 422) {
		return "No encontramos ese lugar. Prueba con otra búsqueda, por ejemplo «Terrassa, Barcelona».";
	}

	return body.error?.description ?? "No se pudo buscar el lugar. Inténtalo de nuevo.";
}

function createInitialDraft(savedZone: UserSearchZoneJson | null): DraftZone {
	if (savedZone) {
		return {
			label: savedZone.label,
			latitude: savedZone.latitude,
			longitude: savedZone.longitude,
		};
	}

	return {
		label: "",
		latitude: DEFAULT_SEARCH_ZONE_MAP_CENTER.latitude,
		longitude: DEFAULT_SEARCH_ZONE_MAP_CENTER.longitude,
	};
}

export function UserSearchZoneEditor({
	savedZone,
	onZoneSaved,
	initialOpen = false,
}: UserSearchZoneEditorProps): ReactElement {
	const [mode, setMode] = useState<EditorMode>(initialOpen ? "editing" : "idle");
	const [query, setQuery] = useState(savedZone?.label ?? "");
	const [draft, setDraft] = useState<DraftZone | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [geocoding, setGeocoding] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const [mapLoadFailed, setMapLoadFailed] = useState(false);
	const userPannedRef = useRef(false);
	const mapConfigState = useInteractiveMapClientConfig();
	const suggestionsState = useSearchZoneSuggestions(mode === "editing" ? query : "");
	const markersState = useNearbyEstablishmentMarkers(
		mode === "editing" && draft
			? { latitude: draft.latitude, longitude: draft.longitude }
			: null,
	);

	useEffect(() => {
		if (!initialOpen) {
			return;
		}

		setQuery(savedZone?.label ?? "");
		setDraft(createInitialDraft(savedZone));
		setMode("editing");
		document.getElementById("search-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [initialOpen, savedZone]);

	useEffect(() => {
		if (mode !== "editing" || suggestionsState.status !== "ready") {
			return;
		}

		if (suggestionsState.query !== query.trim() || userPannedRef.current) {
			return;
		}

		const firstSuggestion = suggestionsState.suggestions[0];
		if (!firstSuggestion) {
			return;
		}

		const nextDraft = {
			label: firstSuggestion.label,
			latitude: firstSuggestion.latitude,
			longitude: firstSuggestion.longitude,
		};

		setDraft((current) => {
			if (
				current &&
				current.label === nextDraft.label &&
				mapLatLngNearlyEqual(current, nextDraft)
			) {
				return current;
			}

			return nextDraft;
		});
	}, [mode, query, suggestionsState]);

	function openEditor(): void {
		setQuery(savedZone?.label ?? "");
		setDraft(createInitialDraft(savedZone));
		setError(null);
		setMapLoadFailed(false);
		userPannedRef.current = false;
		setMode("editing");
	}

	function cancelEditing(): void {
		setDraft(null);
		setError(null);
		setMapLoadFailed(false);
		userPannedRef.current = false;
		setMode("idle");
	}

	function applySuggestion(suggestion: SearchZonePlaceSuggestion): void {
		userPannedRef.current = false;
		setQuery(suggestion.label);
		setDraft({
			label: suggestion.label,
			latitude: suggestion.latitude,
			longitude: suggestion.longitude,
		});
		setError(null);
	}

	function handleMapCenterChange(center: MapLatLng): void {
		userPannedRef.current = true;
		setDraft((current) => {
			if (!current) {
				return {
					label: query.trim() || "Zona seleccionada",
					latitude: center.latitude,
					longitude: center.longitude,
				};
			}

			return {
				...current,
				latitude: center.latitude,
				longitude: center.longitude,
			};
		});
	}

	async function handleLegacyGeocode(event: React.FormEvent): Promise<void> {
		event.preventDefault();

		const trimmed = query.trim();
		if (!trimmed) {
			setError("Escribe un lugar para buscar en el mapa.");
			return;
		}

		setGeocoding(true);
		setError(null);
		setMapLoadFailed(false);
		userPannedRef.current = false;

		const response = await platformFetch("/api/user/search-zone/geocode", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query: trimmed }),
		});

		const body = (await response.json()) as {
			label?: string;
			latitude?: number;
			longitude?: number;
			error?: { description?: string };
		};

		setGeocoding(false);

		if (
			!response.ok ||
			typeof body.label !== "string" ||
			typeof body.latitude !== "number" ||
			typeof body.longitude !== "number"
		) {
			setError(geocodeErrorMessage(response.status, body));
			return;
		}

		setDraft({
			label: body.label,
			latitude: body.latitude,
			longitude: body.longitude,
		});
	}

	async function handleConfirm(): Promise<void> {
		if (!draft) {
			return;
		}

		const label = draft.label.trim() || query.trim();
		if (!label) {
			setError("Elige un lugar o muévete en el mapa para confirmar tu zona.");
			return;
		}

		setConfirming(true);
		setError(null);

		const response = await platformFetch("/api/user/me/search-zone", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				label,
				latitude: draft.latitude,
				longitude: draft.longitude,
			}),
		});

		const body = (await response.json()) as {
			user?: { searchZone?: UserSearchZoneJson | null };
			error?: { description?: string };
		};

		setConfirming(false);

		if (!response.ok || !body.user?.searchZone) {
			setError(body.error?.description ?? "No se pudo guardar la zona. Inténtalo de nuevo.");
			return;
		}

		onZoneSaved(body.user.searchZone);
		setDraft(null);
		setMode("idle");
	}

	function renderMarkersStatus(): ReactElement | null {
		if (markersState.status === "loading") {
			return <p className="text-sm text-muted">Buscando locales cerca…</p>;
		}

		if (markersState.status === "error") {
			return <p className="text-sm text-muted">{markersState.message}</p>;
		}

		if (markersState.status === "ready" && markersState.markers.length === 0) {
			return <p className="text-sm text-muted">No hay locales geocodificados cerca de este punto.</p>;
		}

		return null;
	}

	function renderMapSection(): ReactElement {
		if (!draft) {
			return (
				<div className="flex min-h-[220px] w-full items-center justify-center rounded-theme border border-border bg-surface px-3 py-4">
					<p className="text-sm text-muted">Escribe un lugar para empezar.</p>
				</div>
			);
		}

		if (mapConfigState.status === "loading") {
			return (
				<div className="flex min-h-[220px] w-full items-center justify-center rounded-theme border border-border bg-surface px-3 py-4">
					<p className="text-sm text-muted">Cargando mapa…</p>
				</div>
			);
		}

		if (mapConfigState.status === "ready") {
			return (
				<InteractiveSearchZoneMap
					clientConfig={mapConfigState.config}
					center={{ latitude: draft.latitude, longitude: draft.longitude }}
					onCenterChange={handleMapCenterChange}
					markers={markersState.status === "ready" ? markersState.markers : []}
				/>
			);
		}

		return (
			<div className="flex flex-col gap-3">
				<div className="rounded-theme border border-border bg-surface px-3 py-4">
					<p className="text-sm text-muted">{mapConfigState.message}</p>
				</div>

				{mapLoadFailed ? (
					<div className="rounded-theme border border-border bg-surface px-3 py-4">
						<p className="text-sm text-muted">No se pudo cargar el mapa estático. Inténtalo más tarde.</p>
					</div>
				) : (
					<div className="overflow-hidden rounded-theme border border-border bg-surface">
						<img
							src={buildMapPreviewUrl(draft.latitude, draft.longitude)}
							alt={`Mapa de ${draft.label || "zona seleccionada"}`}
							className="block h-auto w-full"
							onError={() => setMapLoadFailed(true)}
						/>
					</div>
				)}

				<form className="flex flex-col gap-2" onSubmit={(event) => void handleLegacyGeocode(event)}>
					<Button type="submit" variant="secondary" disabled={geocoding}>
						{geocoding ? "Buscando…" : "Buscar con geocodificación"}
					</Button>
				</form>
			</div>
		);
	}

	if (mode === "editing") {
		const showSuggestions =
			suggestionsState.status === "ready" && suggestionsState.suggestions.length > 0;
		const showNoResults =
			suggestionsState.status === "ready" &&
			suggestionsState.suggestions.length === 0 &&
			suggestionsState.query === query.trim() &&
			query.trim().length >= 2;
		const draftLabel = draft?.label.trim() || query.trim() || "tu zona";

		return (
			<Card className="flex flex-col gap-3">
				<p className="text-sm text-muted">
					{savedZone
						? "Busca un nuevo lugar o mueve el mapa para cambiar tu zona de exploración."
						: "Elige dónde quieres explorar locales. Tu zona se usará en «Explorar» en lugar de pedirte la ubicación cada vez."}
				</p>

				<label className="flex flex-col gap-1">
					<span className="text-sm font-medium text-foreground">Lugar</span>
					<Input
						type="text"
						value={query}
						onChange={(event) => {
							userPannedRef.current = false;
							setQuery(event.target.value);
							setError(null);
						}}
						placeholder="Terrassa, Barcelona"
						autoComplete="off"
					/>
				</label>

				{suggestionsState.status === "loading" ? (
					<p className="text-sm text-muted">Buscando lugares…</p>
				) : null}

				{showNoResults ? (
					<p className="text-sm text-muted">No encontramos lugares para esa búsqueda.</p>
				) : null}

				{suggestionsState.status === "error" ? (
					<p className="text-sm text-muted">{suggestionsState.message}</p>
				) : null}

				{showSuggestions ? (
					<SearchZoneSuggestionsList
						suggestions={suggestionsState.suggestions}
						onSelect={applySuggestion}
					/>
				) : null}

				<p className="text-sm text-muted">
					¿Confirmas esta zona?{" "}
					<span className="font-medium text-foreground">{draftLabel}</span>
				</p>

				{renderMapSection()}
				{renderMarkersStatus()}

				{error ? <p className="text-sm text-error">{error}</p> : null}

				<div className="flex flex-col gap-2 sm:flex-row">
					<Button
						type="button"
						className="w-full sm:flex-1"
						disabled={confirming || !draft}
						onClick={() => void handleConfirm()}
					>
						{confirming ? "Guardando…" : "Confirmar zona"}
					</Button>
					<Button
						type="button"
						variant="secondary"
						className="w-full sm:flex-1"
						disabled={confirming}
						onClick={cancelEditing}
					>
						Cancelar
					</Button>
				</div>
			</Card>
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
