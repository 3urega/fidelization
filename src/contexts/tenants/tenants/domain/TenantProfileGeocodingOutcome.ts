import { GeocodingFailed } from "../../../shared/geocoding/domain/GeocodingFailed";
import { GeocodingNotConfigured } from "../../../shared/geocoding/domain/GeocodingNotConfigured";

import {
	TENANT_GEOCODING_STATUS,
	type TenantGeocodingStatus,
} from "./TenantGeocodingStatus";

export type TenantProfileGeocodingOutcome = {
	status: TenantGeocodingStatus;
	message?: string;
};

export type TenantGeocodingFailureCause = GeocodingFailed | GeocodingNotConfigured;

export function resolveTenantGeocodingMessage(
	status: TenantGeocodingStatus,
	cause?: TenantGeocodingFailureCause,
): string | undefined {
	switch (status) {
		case TENANT_GEOCODING_STATUS.Ok:
			return "Ubicación confirmada en el mapa.";
		case TENANT_GEOCODING_STATUS.Cleared:
			return "Ubicación eliminada.";
		case TENANT_GEOCODING_STATUS.Skipped:
			return undefined;
		case TENANT_GEOCODING_STATUS.Failed:
			if (cause instanceof GeocodingNotConfigured) {
				return "Servicio de ubicación no disponible. Inténtalo más tarde o contacta con soporte.";
			}

			return "No pudimos ubicar esta dirección. Revisa el texto e inténtalo de nuevo.";
		default:
			return undefined;
	}
}

export function tenantProfileGeocodingOutcome(
	status: TenantGeocodingStatus,
	cause?: TenantGeocodingFailureCause,
): TenantProfileGeocodingOutcome {
	const message = resolveTenantGeocodingMessage(status, cause);

	return message ? { status, message } : { status };
}
