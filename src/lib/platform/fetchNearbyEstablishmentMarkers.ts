import type { EstablishmentMapMarker } from "../../app/_components/platform-app/maps/types";
import { platformFetch } from "./apiUrl";

export type FetchNearbyEstablishmentMarkersParams = {
	latitude: number;
	longitude: number;
	radiusKm?: number;
};

export type FetchNearbyEstablishmentMarkersResult =
	| { ok: true; markers: EstablishmentMapMarker[] }
	| { ok: false; status: number; message: string };

export async function fetchNearbyEstablishmentMarkers(
	params: FetchNearbyEstablishmentMarkersParams,
): Promise<FetchNearbyEstablishmentMarkersResult> {
	const searchParams = new URLSearchParams({
		lat: String(params.latitude),
		lng: String(params.longitude),
	});

	if (params.radiusKm !== undefined) {
		searchParams.set("radiusKm", String(params.radiusKm));
	}

	const response = await platformFetch(
		`/api/user/search-zone/nearby-establishments?${searchParams.toString()}`,
	);

	const body = (await response.json()) as {
		markers?: EstablishmentMapMarker[];
		error?: { description?: string };
	};

	if (!response.ok || !Array.isArray(body.markers)) {
		return {
			ok: false,
			status: response.status,
			message: body.error?.description ?? "No se pudieron cargar los locales cercanos.",
		};
	}

	return { ok: true, markers: body.markers };
}
