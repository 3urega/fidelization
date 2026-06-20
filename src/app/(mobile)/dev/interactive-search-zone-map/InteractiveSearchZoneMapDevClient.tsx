"use client";

import { type ReactElement, useState } from "react";

import { InteractiveSearchZoneMap } from "../../../_components/platform-app/maps/InteractiveSearchZoneMap";
import type { MapLatLng } from "../../../_components/platform-app/maps/types";

const DEMO_CENTER: MapLatLng = {
	latitude: 41.5631,
	longitude: 2.0084,
};

export function InteractiveSearchZoneMapDevClient(): ReactElement {
	const [center, setCenter] = useState<MapLatLng>(DEMO_CENTER);

	return (
		<div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
			<h1 className="text-lg font-semibold text-foreground">Dev: mapa interactivo de zona</h1>
			<p className="text-sm text-muted">
				Arrastra el mapa para mover el pin de zona. Centro actual: {center.latitude.toFixed(5)},{" "}
				{center.longitude.toFixed(5)}
			</p>
			<InteractiveSearchZoneMap
				center={center}
				zonePin={center}
				onCenterChange={(nextCenter) => {
					setCenter(nextCenter);
					console.log("[dev] onCenterChange", nextCenter);
				}}
			/>
		</div>
	);
}
