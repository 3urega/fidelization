"use client";

import { useEffect, useState } from "react";

import { platformFetch } from "../../../../lib/platform/apiUrl";
import type { InteractiveMapClientConfigJson } from "./types";

export type InteractiveMapClientConfigState =
	| { status: "loading" }
	| { status: "ready"; config: InteractiveMapClientConfigJson }
	| { status: "unavailable"; message: string };

function resolveUnavailableMessage(status: number): string {
	if (status === 401) {
		return "Inicia sesión para ver el mapa interactivo.";
	}

	if (status === 503) {
		return "El servicio de ubicación no está disponible. Inténtalo más tarde.";
	}

	return "No se pudo cargar el mapa. Inténtalo más tarde.";
}

export function useInteractiveMapClientConfig(): InteractiveMapClientConfigState {
	const [state, setState] = useState<InteractiveMapClientConfigState>({ status: "loading" });

	useEffect(() => {
		let cancelled = false;

		async function loadConfig(): Promise<void> {
			try {
				const response = await platformFetch("/api/user/search-zone/map-client-config");
				const body = (await response.json()) as InteractiveMapClientConfigJson & {
					error?: { description?: string };
				};

				if (cancelled) {
					return;
				}

				if (
					!response.ok ||
					(body.provider !== "mapbox" && body.provider !== "google") ||
					typeof body.publicToken !== "string" ||
					body.publicToken.length === 0
				) {
					setState({
						status: "unavailable",
						message: body.error?.description ?? resolveUnavailableMessage(response.status),
					});

					return;
				}

				setState({
					status: "ready",
					config: {
						provider: body.provider,
						publicToken: body.publicToken,
						...(body.mapId ? { mapId: body.mapId } : {}),
						...(body.language ? { language: body.language } : {}),
					},
				});
			} catch {
				if (!cancelled) {
					setState({
						status: "unavailable",
						message: "No se pudo cargar el mapa. Inténtalo más tarde.",
					});
				}
			}
		}

		void loadConfig();

		return () => {
			cancelled = true;
		};
	}, []);

	return state;
}
