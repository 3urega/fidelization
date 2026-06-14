import {
	TENANT_GEOCODING_STATUS,
	type TenantGeocodingStatus,
} from "../../contexts/tenants/tenants/domain/TenantGeocodingStatus";

export type TenantGeocodingDisplayState =
	| { variant: "none" }
	| { variant: "confirmed"; message: string }
	| { variant: "pending"; message: string; showRetry: true }
	| { variant: "failed"; message: string; showRetry: true }
	| { variant: "cleared"; message: string };

export type TenantGeocodingSessionInput = {
	address?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	geocodedAt?: string | null;
};

const PENDING_MESSAGE =
	"No hemos podido confirmar la ubicación de esta dirección. Revisa el texto o reintenta.";

function hasCoordinates(tenant: TenantGeocodingSessionInput): boolean {
	return tenant.latitude !== null && tenant.latitude !== undefined &&
		tenant.longitude !== null && tenant.longitude !== undefined;
}

function formatConfirmedMessage(geocodedAt: string | null | undefined): string {
	if (!geocodedAt) {
		return "Ubicación confirmada en el mapa.";
	}

	const date = new Date(geocodedAt);
	if (Number.isNaN(date.getTime())) {
		return "Ubicación confirmada en el mapa.";
	}

	const formattedDate = date.toLocaleDateString("es-ES", {
		day: "numeric",
		month: "numeric",
		year: "numeric",
	});

	return `Ubicación confirmada el ${formattedDate}.`;
}

export function deriveTenantGeocodingDisplayState(
	tenant: TenantGeocodingSessionInput,
): TenantGeocodingDisplayState {
	const address = tenant.address?.trim() ?? "";

	if (!address) {
		return { variant: "none" };
	}

	if (hasCoordinates(tenant)) {
		return {
			variant: "confirmed",
			message: formatConfirmedMessage(tenant.geocodedAt),
		};
	}

	return {
		variant: "pending",
		message: PENDING_MESSAGE,
		showRetry: true,
	};
}

export function displayStateFromPatchResponse(
	status: TenantGeocodingStatus,
	message?: string,
): TenantGeocodingDisplayState | null {
	switch (status) {
		case TENANT_GEOCODING_STATUS.Ok:
			return {
				variant: "confirmed",
				message: message ?? "Ubicación confirmada en el mapa.",
			};
		case TENANT_GEOCODING_STATUS.Failed:
			return {
				variant: "failed",
				message:
					message ??
					"No pudimos ubicar esta dirección. Revisa el texto e inténtalo de nuevo.",
				showRetry: true,
			};
		case TENANT_GEOCODING_STATUS.Cleared:
			return {
				variant: "cleared",
				message: message ?? "Ubicación eliminada.",
			};
		case TENANT_GEOCODING_STATUS.Skipped:
			return null;
		default:
			return null;
	}
}
