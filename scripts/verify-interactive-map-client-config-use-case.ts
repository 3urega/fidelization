/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { GetInteractiveMapClientConfig } from "../src/contexts/identity/users/application/profile/GetInteractiveMapClientConfig";
import { GeocodingNotConfigured } from "../src/contexts/shared/geocoding/domain/GeocodingNotConfigured";
import type { InteractiveMapClientConfig } from "../src/contexts/shared/maps/domain/InteractiveMapClientConfig";
import { InteractiveMapClientConfigProvider } from "../src/contexts/shared/maps/domain/InteractiveMapClientConfigProvider";
import { InteractiveMapClientConfigMapbox } from "../src/contexts/shared/maps/infrastructure/InteractiveMapClientConfigMapbox";
import {
	assertPublicMapboxToken,
	resolveMapboxPublicAccessToken,
} from "../src/lib/maps/assertPublicMapboxToken";

class SuccessStubInteractiveMapClientConfigProvider extends InteractiveMapClientConfigProvider {
	getConfig(): InteractiveMapClientConfig {
		return {
			provider: "mapbox",
			publicToken: "pk.test-public-token",
			mapId: "mapbox://styles/mapbox/streets-v12",
			language: "es",
		};
	}
}

class NotConfiguredStubInteractiveMapClientConfigProvider extends InteractiveMapClientConfigProvider {
	getConfig(): InteractiveMapClientConfig {
		throw new GeocodingNotConfigured("mapbox");
	}
}

function assertPublicMapboxTokenGuard(): void {
	const publicToken = assertPublicMapboxToken("pk.test-token");
	if (publicToken !== "pk.test-token") {
		console.error("❌ assertPublicMapboxToken should return pk token");
		process.exit(1);
	}

	try {
		assertPublicMapboxToken("sk.secret-token");
		console.error("❌ sk token should throw GeocodingNotConfigured");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof GeocodingNotConfigured)) {
			console.error("❌ sk token wrong error", error);
			process.exit(1);
		}
	}

	const resolved = resolveMapboxPublicAccessToken({
		mapboxPublicAccessToken: undefined,
		mapboxAccessToken: "pk.fallback-token",
	});
	if (resolved !== "pk.fallback-token") {
		console.error("❌ resolveMapboxPublicAccessToken fallback failed", resolved);
		process.exit(1);
	}

	console.log("✅ public Mapbox token guard accepts pk and rejects sk");
}

function assertMapboxAdapterUsesPublicToken(): void {
	const originalPublic = process.env.MAPBOX_PUBLIC_ACCESS_TOKEN;
	const originalServer = process.env.MAPBOX_ACCESS_TOKEN;

	process.env.MAPBOX_PUBLIC_ACCESS_TOKEN = "pk.adapter-token";
	process.env.MAPBOX_ACCESS_TOKEN = "sk.server-secret";

	try {
		const config = new InteractiveMapClientConfigMapbox().getConfig();
		if (config.publicToken !== "pk.adapter-token" || config.provider !== "mapbox") {
			console.error("❌ Mapbox adapter config", config);
			process.exit(1);
		}
	} finally {
		if (originalPublic === undefined) {
			delete process.env.MAPBOX_PUBLIC_ACCESS_TOKEN;
		} else {
			process.env.MAPBOX_PUBLIC_ACCESS_TOKEN = originalPublic;
		}

		if (originalServer === undefined) {
			delete process.env.MAPBOX_ACCESS_TOKEN;
		} else {
			process.env.MAPBOX_ACCESS_TOKEN = originalServer;
		}
	}

	console.log("✅ Mapbox adapter returns public token only");
}

async function main(): Promise<void> {
	assertPublicMapboxTokenGuard();
	assertMapboxAdapterUsesPublicToken();

	const useCase = new GetInteractiveMapClientConfig(new SuccessStubInteractiveMapClientConfigProvider());
	const config = useCase.execute();

	if (
		config.provider !== "mapbox" ||
		config.publicToken !== "pk.test-public-token" ||
		config.language !== "es"
	) {
		console.error("❌ use case config", config);
		process.exit(1);
	}

	console.log("✅ GetInteractiveMapClientConfig returns provider + publicToken");

	const notConfigured = new GetInteractiveMapClientConfig(
		new NotConfiguredStubInteractiveMapClientConfigProvider(),
	);

	try {
		notConfigured.execute();
		console.error("❌ not configured should throw GeocodingNotConfigured");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof GeocodingNotConfigured)) {
			console.error("❌ not configured wrong error", error);
			process.exit(1);
		}
	}

	console.log("✅ provider not configured → GeocodingNotConfigured");
	console.log("✅ verify:interactive-map-client-config-use-case passed");
}

void main();
