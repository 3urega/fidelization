export type UserLocationResult = {
	latitude: number;
	longitude: number;
};

export type UserLocationErrorCode = "denied" | "unavailable" | "timeout";

export class UserLocationError extends Error {
	constructor(
		readonly code: UserLocationErrorCode,
		message: string,
	) {
		super(message);
		this.name = "UserLocationError";
	}
}

export type GeolocationProvider = {
	getCurrentPosition: () => Promise<UserLocationResult>;
};

const DEFAULT_TIMEOUT_MS = 10_000;

function assertValidCoordinates(latitude: number, longitude: number): UserLocationResult {
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		throw new UserLocationError("unavailable", "Invalid coordinates returned by geolocation.");
	}

	return { latitude, longitude };
}

function createBrowserGeolocationProvider(timeoutMs = DEFAULT_TIMEOUT_MS): GeolocationProvider {
	return {
		getCurrentPosition(): Promise<UserLocationResult> {
			if (typeof navigator === "undefined" || !navigator.geolocation) {
				return Promise.reject(
					new UserLocationError("unavailable", "Geolocation is not available in this browser."),
				);
			}

			return new Promise<UserLocationResult>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						resolve(
							assertValidCoordinates(position.coords.latitude, position.coords.longitude),
						);
					},
					(error) => {
						if (error.code === error.PERMISSION_DENIED) {
							reject(
								new UserLocationError(
									"denied",
									"Location permission was denied.",
								),
							);

							return;
						}

						if (error.code === error.TIMEOUT) {
							reject(new UserLocationError("timeout", "Location request timed out."));

							return;
						}

						reject(
							new UserLocationError(
								"unavailable",
								error.message || "Could not determine your location.",
							),
						);
					},
					{
						enableHighAccuracy: false,
						timeout: timeoutMs,
						maximumAge: 60_000,
					},
				);
			});
		},
	};
}

async function createNativeGeolocationProvider(): Promise<GeolocationProvider> {
	const { Geolocation } = await import("@capacitor/geolocation");

	return {
		async getCurrentPosition(): Promise<UserLocationResult> {
			const permission = await Geolocation.requestPermissions();

			if (permission.location === "denied") {
				throw new UserLocationError("denied", "Location permission was denied.");
			}

			const position = await Geolocation.getCurrentPosition({
				enableHighAccuracy: false,
				timeout: DEFAULT_TIMEOUT_MS,
				maximumAge: 60_000,
			});

			return assertValidCoordinates(position.coords.latitude, position.coords.longitude);
		},
	};
}

async function resolveDefaultGeolocationProvider(): Promise<GeolocationProvider> {
	if (typeof window === "undefined") {
		throw new UserLocationError("unavailable", "Geolocation is only available in the browser.");
	}

	const { Capacitor } = await import("@capacitor/core");

	if (Capacitor.isNativePlatform()) {
		return createNativeGeolocationProvider();
	}

	return createBrowserGeolocationProvider();
}

export async function requestUserLocation(
	provider?: GeolocationProvider,
): Promise<UserLocationResult> {
	const resolvedProvider = provider ?? (await resolveDefaultGeolocationProvider());

	return resolvedProvider.getCurrentPosition();
}
