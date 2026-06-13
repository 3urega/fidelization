"use client";

import { useCallback, useState } from "react";

import {
	requestUserLocation,
	UserLocationError,
	type UserLocationResult,
} from "./requestUserLocation";

export type UserLocationState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "ready"; location: UserLocationResult }
	| { status: "denied"; message: string }
	| { status: "error"; message: string };

function mapUserLocationError(error: unknown): UserLocationState {
	if (error instanceof UserLocationError) {
		if (error.code === "denied") {
			return {
				status: "denied",
				message: "Activa la ubicación para ver locales cerca de ti.",
			};
		}

		return {
			status: "error",
			message:
				error.code === "timeout"
					? "No se pudo obtener tu ubicación a tiempo. Inténtalo de nuevo."
					: "No se pudo obtener tu ubicación.",
		};
	}

	return {
		status: "error",
		message: "No se pudo obtener tu ubicación.",
	};
}

export function useUserLocation(): {
	state: UserLocationState;
	request: () => Promise<UserLocationResult | null>;
	reset: () => void;
} {
	const [state, setState] = useState<UserLocationState>({ status: "idle" });

	const request = useCallback(async (): Promise<UserLocationResult | null> => {
		setState({ status: "loading" });

		try {
			const location = await requestUserLocation();
			setState({ status: "ready", location });

			return location;
		} catch (error) {
			setState(mapUserLocationError(error));

			return null;
		}
	}, []);

	const reset = useCallback((): void => {
		setState({ status: "idle" });
	}, []);

	return { state, request, reset };
}
