"use client";

import { type ReactElement, useEffect, useState } from "react";

import { platformFetch, resolvePlatformApiUrl } from "../../../lib/platform/apiUrl";
import type {
	SearchZoneDraft,
	UserSearchZoneJson,
} from "../../../lib/platform/resolveSearchZoneMapInitialDraft";
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

export type { UserSearchZoneJson, SearchZoneDraft };

export type SearchZoneMapEditorVariant = "embedded" | "page";

type SearchZoneMapEditorProps = {
	savedZone: UserSearchZoneJson | null;
	initialDraft: SearchZoneDraft;
	initialQuery?: string;
	onZoneSaved: (zone: UserSearchZoneJson) => void;
	onCancel: () => void;
	variant?: SearchZoneMapEditorVariant;
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

const MAP_MIN_HEIGHT = {
	embedded: "h-[220px]",
	page: "h-[min(60vh,520px)]",
} as const;

export function SearchZoneMapEditor({
	savedZone,
	initialDraft,
	initialQuery,
	onZoneSaved,
	onCancel,
	variant = "embedded",
}: SearchZoneMapEditorProps): ReactElement {
	const [query, setQuery] = useState(initialQuery ?? initialDraft.label);
	const [draft, setDraft] = useState<SearchZoneDraft>(initialDraft);
	const [mapViewCenter, setMapViewCenter] = useState<MapLatLng>({
		latitude: initialDraft.latitude,
		longitude: initialDraft.longitude,
	});
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [geocoding, setGeocoding] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const [mapLoadFailed, setMapLoadFailed] = useState(false);
	const mapConfigState = useInteractiveMapClientConfig();
	const suggestionsState = useSearchZoneSuggestions(query);
	const markersState = useNearbyEstablishmentMarkers({
		latitude: draft.latitude,
		longitude: draft.longitude,
	});
	const mapMinHeight = MAP_MIN_HEIGHT[variant];

	useEffect(() => {
		setQuery(initialQuery ?? initialDraft.label);
		setDraft(initialDraft);
		setMapViewCenter({
			latitude: initialDraft.latitude,
			longitude: initialDraft.longitude,
		});
		setError(null);
		setSuccess(null);
		setMapLoadFailed(false);
	}, [initialDraft, initialQuery]);

	function applyExplicitZone(next: SearchZoneDraft): void {
		setDraft(next);
		setMapViewCenter({
			latitude: next.latitude,
			longitude: next.longitude,
		});
	}

	function applySuggestion(suggestion: SearchZonePlaceSuggestion): void {
		setQuery(suggestion.label);
		applyExplicitZone({
			label: suggestion.label,
			latitude: suggestion.latitude,
			longitude: suggestion.longitude,
		});
		setError(null);
		setSuccess(null);
	}

	function handleMapCenterChange(center: MapLatLng): void {
		setDraft((current) => ({
			...current,
			latitude: center.latitude,
			longitude: center.longitude,
			label: current.label.trim() || query.trim() || "Zona seleccionada",
		}));
		setSuccess(null);
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
		setSuccess(null);
		setMapLoadFailed(false);

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

		applyExplicitZone({
			label: body.label,
			latitude: body.latitude,
			longitude: body.longitude,
		});
	}

	async function handleConfirm(): Promise<void> {
		const label = draft.label.trim() || query.trim();
		if (!label) {
			setError("Elige un lugar o muévete en el mapa para confirmar tu zona.");
			return;
		}

		setConfirming(true);
		setError(null);
		setSuccess(null);

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

		const zone = body.user.searchZone;
		onZoneSaved(zone);
		applyExplicitZone({
			label: zone.label,
			latitude: zone.latitude,
			longitude: zone.longitude,
		});
		setQuery(zone.label);
		setSuccess("Zona de búsqueda guardada.");
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
		if (mapConfigState.status === "loading") {
			return (
				<div
					className={`flex ${mapMinHeight} w-full items-center justify-center rounded-theme border border-border bg-surface px-3 py-4`}
				>
					<p className="text-sm text-muted">Cargando mapa…</p>
				</div>
			);
		}

		if (mapConfigState.status === "ready") {
			return (
				<InteractiveSearchZoneMap
					clientConfig={mapConfigState.config}
					center={mapViewCenter}
					onCenterChange={handleMapCenterChange}
					markers={markersState.status === "ready" ? markersState.markers : []}
					className={`${mapMinHeight} w-full`}
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

	const showSuggestions =
		suggestionsState.status === "ready" && suggestionsState.suggestions.length > 0;
	const showNoResults =
		suggestionsState.status === "ready" &&
		suggestionsState.suggestions.length === 0 &&
		suggestionsState.query === query.trim() &&
		query.trim().length >= 2;
	const draftLabel = draft.label.trim() || query.trim() || "tu zona";

	const introCopy =
		variant === "page"
			? savedZone
				? "Explora el mapa, busca un lugar o arrastra el mapa para cambiar tu zona."
				: "Explora locales en el mapa y confirma dónde quieres buscar."
			: savedZone
				? "Busca un nuevo lugar o mueve el mapa para cambiar tu zona de exploración."
				: "Elige dónde quieres explorar locales. Tu zona se usará en «Explorar» en lugar de pedirte la ubicación cada vez.";

	const cancelLabel = variant === "page" ? "Volver" : "Cancelar";

	const content = (
		<>
			<p className="text-sm text-muted">{introCopy}</p>

			<label className="flex flex-col gap-1">
				<span className="text-sm font-medium text-foreground">Lugar</span>
				<Input
					type="text"
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setError(null);
						setSuccess(null);
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
			<p className="text-xs text-muted">
				Arrastra el mapa para mover la zona; el pin marca el centro. Usa la rueda del ratón o los botones +/−
				para ampliar.
			</p>

			{renderMapSection()}
			{renderMarkersStatus()}

			{success ? <p className="text-sm text-primary">{success}</p> : null}
			{error ? <p className="text-sm text-error">{error}</p> : null}

			<div className="flex flex-col gap-2 sm:flex-row">
				<Button
					type="button"
					className="w-full sm:flex-1"
					disabled={confirming}
					onClick={() => void handleConfirm()}
				>
					{confirming ? "Guardando…" : "Confirmar zona"}
				</Button>
				<Button
					type="button"
					variant="secondary"
					className="w-full sm:flex-1"
					disabled={confirming}
					onClick={onCancel}
				>
					{cancelLabel}
				</Button>
			</div>
		</>
	);

	if (variant === "page") {
		return <div className="flex flex-col gap-3">{content}</div>;
	}

	return <Card className="flex flex-col gap-3">{content}</Card>;
}
