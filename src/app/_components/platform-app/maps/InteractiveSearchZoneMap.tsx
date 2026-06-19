"use client";

import { lazy, Suspense, type ReactElement } from "react";

import { useInteractiveMapClientConfig } from "./useInteractiveMapClientConfig";
import type { InteractiveSearchZoneMapProps } from "./types";

const MapboxInteractiveMap = lazy(() =>
	import("./MapboxInteractiveMap").then((module) => ({ default: module.MapboxInteractiveMap })),
);

const GoogleInteractiveMap = lazy(() =>
	import("./GoogleInteractiveMap").then((module) => ({ default: module.GoogleInteractiveMap })),
);

function MapFallback({ message }: { message: string }): ReactElement {
	return (
		<div className="flex min-h-[220px] w-full items-center justify-center rounded-theme border border-border bg-surface px-3 py-4">
			<p className="text-sm text-muted">{message}</p>
		</div>
	);
}

function MapLoadingSkeleton(): ReactElement {
	return (
		<div className="flex min-h-[220px] w-full items-center justify-center rounded-theme border border-border bg-surface px-3 py-4">
			<p className="text-sm text-muted">Cargando mapa…</p>
		</div>
	);
}

export function InteractiveSearchZoneMap(props: InteractiveSearchZoneMapProps): ReactElement {
	const configState = useInteractiveMapClientConfig();

	if (configState.status === "loading") {
		return <MapLoadingSkeleton />;
	}

	if (configState.status === "unavailable") {
		return <MapFallback message={configState.message} />;
	}

	const Adapter =
		configState.config.provider === "google" ? GoogleInteractiveMap : MapboxInteractiveMap;

	return (
		<Suspense fallback={<MapLoadingSkeleton />}>
			<Adapter {...props} config={configState.config} />
		</Suspense>
	);
}
