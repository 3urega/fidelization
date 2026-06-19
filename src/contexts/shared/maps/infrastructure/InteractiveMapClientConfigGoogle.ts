import { Service } from "diod";

import { env } from "../../../../lib/env";
import { GeocodingNotConfigured } from "../../geocoding/domain/GeocodingNotConfigured";
import type { InteractiveMapClientConfig } from "../domain/InteractiveMapClientConfig";
import { InteractiveMapClientConfigProvider } from "../domain/InteractiveMapClientConfigProvider";

const DEFAULT_LANGUAGE = "es";

@Service()
export class InteractiveMapClientConfigGoogle extends InteractiveMapClientConfigProvider {
	getConfig(): InteractiveMapClientConfig {
		const publicToken = env.googleMapsJsApiKey?.trim();

		if (!publicToken) {
			throw new GeocodingNotConfigured("google");
		}

		return {
			provider: "google",
			publicToken,
			...(env.googleMapsMapId ? { mapId: env.googleMapsMapId } : {}),
			language: DEFAULT_LANGUAGE,
		};
	}
}
