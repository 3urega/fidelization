import { Service } from "diod";

import { env } from "../../../../lib/env";
import { resolveMapboxPublicAccessToken } from "../../../../lib/maps/assertPublicMapboxToken";
import type { InteractiveMapClientConfig } from "../domain/InteractiveMapClientConfig";
import { InteractiveMapClientConfigProvider } from "../domain/InteractiveMapClientConfigProvider";

const DEFAULT_MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";
const DEFAULT_LANGUAGE = "es";

@Service()
export class InteractiveMapClientConfigMapbox extends InteractiveMapClientConfigProvider {
	getConfig(): InteractiveMapClientConfig {
		const publicToken = resolveMapboxPublicAccessToken({
			mapboxPublicAccessToken: env.mapboxPublicAccessToken,
			mapboxAccessToken: env.mapboxAccessToken,
		});

		return {
			provider: "mapbox",
			publicToken,
			mapId: env.mapboxStyleUrl ?? DEFAULT_MAPBOX_STYLE,
			language: DEFAULT_LANGUAGE,
		};
	}
}
