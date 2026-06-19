export type MapLatLng = {
	latitude: number;
	longitude: number;
};

/** Matches domain `EstablishmentMapMarker` and nearby-establishments API JSON. */
export type EstablishmentMapMarker = {
	id: string;
	slug: string;
	name: string;
	latitude: number;
	longitude: number;
	logoUrl?: string;
};

export type InteractiveMapClientConfigJson = {
	provider: "mapbox" | "google";
	publicToken: string;
	mapId?: string;
	language?: string;
};

export type InteractiveSearchZoneMapProps = {
	center: MapLatLng;
	zoom?: number;
	onCenterChange?: (center: MapLatLng) => void;
	markers?: EstablishmentMapMarker[];
	interactive?: boolean;
	className?: string;
};

export type InteractiveMapAdapterProps = InteractiveSearchZoneMapProps & {
	config: InteractiveMapClientConfigJson;
};
