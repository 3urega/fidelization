import type { GeocodingProviderId } from "../../geocoding/domain/GeocodingProvider";

export type InteractiveMapClientConfig = {
	provider: GeocodingProviderId;
	publicToken: string;
	mapId?: string;
	language?: string;
};
