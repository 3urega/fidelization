"use client";

import { type ReactElement, useState } from "react";

type TenantGeocodingMapPreviewProps = {
	latitude: number | null;
	longitude: number | null;
};

function hasCoordinates(latitude: number | null, longitude: number | null): boolean {
	return latitude !== null && longitude !== null;
}

export function TenantGeocodingMapPreview({
	latitude,
	longitude,
}: TenantGeocodingMapPreviewProps): ReactElement {
	const [loadFailed, setLoadFailed] = useState(false);

	if (!hasCoordinates(latitude, longitude)) {
		return (
			<div className="rounded-theme border border-border bg-surface px-3 py-4">
				<p className="text-sm text-muted">Añade y guarda una dirección para ver el mapa.</p>
			</div>
		);
	}

	if (loadFailed) {
		return (
			<div className="rounded-theme border border-border bg-surface px-3 py-4">
				<p className="text-sm text-muted">No se pudo cargar el mapa. Inténtalo más tarde.</p>
			</div>
		);
	}

	return (
		<figure className="flex flex-col gap-2">
			<figcaption className="text-sm text-foreground">Ubicación de tu negocio en el mapa</figcaption>
			<div className="overflow-hidden rounded-theme border border-border bg-surface">
				<img
					src="/api/tenant/geocoding-map-preview"
					alt="Ubicación de tu negocio en el mapa"
					className="block h-auto w-full"
					onError={() => setLoadFailed(true)}
				/>
			</div>
		</figure>
	);
}
