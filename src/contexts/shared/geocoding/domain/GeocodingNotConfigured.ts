import { DomainError } from "../../domain/DomainError";

import { type GeocodingProviderId } from "./GeocodingProvider";

export class GeocodingNotConfigured extends DomainError {
	readonly type = "GeocodingNotConfigured";
	readonly message: string;
	readonly provider: GeocodingProviderId;

	constructor(provider: GeocodingProviderId) {
		const message = `Geocoding provider "${provider}" is not configured (missing API token or key)`;
		super(message);
		this.message = message;
		this.provider = provider;
	}
}
