"use client";

import { type ReactElement, useEffect, useState } from "react";

import { platformFetch, resolvePlatformApiUrl } from "../../../lib/platform/apiUrl";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

export type UserSearchZoneJson = {
	label: string;
	latitude: number;
	longitude: number;
	updatedAt: string;
};

type EditorMode = "idle" | "editing" | "preview";

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

	useEffect(() => {
		if (!initialOpen) {
			return;
		}

		setMode("editing");
		document.getElementById("search-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, [initialOpen]);

	function openEditor(): void {
		setQuery(savedZone?.label ?? "");
		setDraft(null);
		setError(null);
		setMapLoadFailed(false);
		setMode("editing");
	}

	function cancelEditing(): void {
		setDraft(null);
		setError(null);
		setMapLoadFailed(false);
		setMode("idle");
	}

	async function handleGeocode(event: React.FormEvent): Promise<void> {
		event.preventDefault();

		const trimmed = query.trim();
		if (!trimmed) {
			setError("Escribe un lugar para buscar en el mapa.");
			return;
		}

		setGeocoding(true);
		setError(null);
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

		setDraft({
			label: body.label,
			latitude: body.latitude,
			longitude: body.longitude,
		});
		setMode("preview");
	}

	async function handleConfirm(): Promise<void> {
		if (!draft) {
			return;
		}

		setConfirming(true);
		setError(null);

		const response = await platformFetch("/api/user/me/search-zone", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				label: draft.label,
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

	if (mode === "preview" && draft) {
		return (
			<Card className="flex flex-col gap-3">
				<p className="text-sm text-muted">
					¿Confirmas esta zona?{" "}
					<span className="font-medium text-foreground">{draft.label}</span>
				</p>

				{mapLoadFailed ? (
					<div className="rounded-theme border border-border bg-surface px-3 py-4">
						<p className="text-sm text-muted">No se pudo cargar el mapa. Inténtalo más tarde.</p>
					</div>
				) : (
					<div className="overflow-hidden rounded-theme border border-border bg-surface">
						<img
							src={buildMapPreviewUrl(draft.latitude, draft.longitude)}
							alt={`Mapa de ${draft.label}`}
							className="block h-auto w-full"
							onError={() => setMapLoadFailed(true)}
						/>
					</div>
				)}

				{error ? <p className="text-sm text-error">{error}</p> : null}

				<div className="flex flex-col gap-2 sm:flex-row">
					<Button type="button" className="w-full sm:flex-1" disabled={confirming} onClick={() => void handleConfirm()}>
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

	if (mode === "editing") {
		return (
			<Card className="flex flex-col gap-3">
				<p className="text-sm text-muted">
					{savedZone
						? "Busca un nuevo lugar para cambiar tu zona de exploración."
						: "Elige dónde quieres explorar locales. Tu zona se usará en «Explorar» en lugar de pedirte la ubicación cada vez."}
				</p>

				<form className="flex flex-col gap-3" onSubmit={(event) => void handleGeocode(event)}>
					<label className="flex flex-col gap-1">
						<span className="text-sm font-medium text-foreground">Lugar</span>
						<Input
							type="text"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Terrassa, Barcelona"
							autoComplete="off"
						/>
					</label>

					{error ? <p className="text-sm text-error">{error}</p> : null}

					<div className="flex flex-col gap-2 sm:flex-row">
						<Button type="submit" className="w-full sm:flex-1" disabled={geocoding}>
							{geocoding ? "Buscando…" : "Buscar en mapa"}
						</Button>
						<Button
							type="button"
							variant="secondary"
							className="w-full sm:flex-1"
							disabled={geocoding}
							onClick={cancelEditing}
						>
							Cancelar
						</Button>
					</div>
				</form>
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
