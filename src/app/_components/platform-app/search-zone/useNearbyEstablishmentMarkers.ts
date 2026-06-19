"use client";

import { useEffect, useState } from "react";

import { fetchNearbyEstablishmentMarkers } from "../../../../lib/platform/fetchNearbyEstablishmentMarkers";
import { useDebouncedValue } from "../../../../lib/react/useDebouncedValue";
import type { EstablishmentMapMarker } from "../maps/types";

export type NearbyEstablishmentMarkersState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "ready"; markers: EstablishmentMapMarker[] }
	| { status: "error"; message: string };

const DEFAULT_DEBOUNCE_MS = 400;

type Coordinates = {
	latitude: number;
	longitude: number;
};

export function useNearbyEstablishmentMarkers(
	coordinates: Coordinates | null,
	debounceMs = DEFAULT_DEBOUNCE_MS,
): NearbyEstablishmentMarkersState {
	const latitude = coordinates?.latitude ?? null;
	const longitude = coordinates?.longitude ?? null;
	const debouncedLatitude = useDebouncedValue(latitude, debounceMs);
	const debouncedLongitude = useDebouncedValue(longitude, debounceMs);
	const [state, setState] = useState<NearbyEstablishmentMarkersState>({ status: "idle" });

	useEffect(() => {
		if (debouncedLatitude === null || debouncedLongitude === null) {
			setState({ status: "idle" });

			return;
		}

		let cancelled = false;

		async function loadMarkers(): Promise<void> {
			setState({ status: "loading" });

			const result = await fetchNearbyEstablishmentMarkers({
				latitude: debouncedLatitude!,
				longitude: debouncedLongitude!,
			});

			if (cancelled) {
				return;
			}

			if (!result.ok) {
				setState({
					status: "error",
					message: result.message,
				});

				return;
			}

			setState({
				status: "ready",
				markers: result.markers,
			});
		}

		void loadMarkers();

		return () => {
			cancelled = true;
		};
	}, [debouncedLatitude, debouncedLongitude]);

	return state;
}
