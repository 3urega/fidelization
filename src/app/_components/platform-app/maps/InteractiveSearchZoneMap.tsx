"use client";

import { lazy, Suspense, type ReactElement } from "react";

import { useInteractiveMapClientConfig } from "./useInteractiveMapClientConfig";
import type { InteractiveMapClientConfigJson, InteractiveSearchZoneMapProps } from "./types";

const MapboxInteractiveMap = lazy(() =>
	import("./MapboxInteractiveMap").then((module) => ({ default: module.MapboxInteractiveMap })),
);

const GoogleInteractiveMap = lazy(() =>
	import("./GoogleInteractiveMap").then((module) => ({ default: module.GoogleInteractiveMap })),
);

export type InteractiveSearchZoneMapAllProps = InteractiveSearchZoneMapProps & {
	clientConfig?: InteractiveMapClientConfigJson;
};

function MapFallback({ message }: { message: string }): ReactElement {
	return (
		<div className="flex h-[220px] w-full items-center justify-center rounded-theme border border-border bg-surface px-3 py-4">
			<p className="text-sm text-muted">{message}</p>
		</div>
	);
}

function MapLoadingSkeleton(): ReactElement {
	return (
		<div className="flex h-[220px] w-full items-center justify-center rounded-theme border border-border bg-surface px-3 py-4">
			<p className="text-sm text-muted">Cargando mapa…</p>
		</div>
	);
}

function InteractiveSearchZoneMapInner({
	clientConfig,
	...props
}: InteractiveSearchZoneMapAllProps & {
	clientConfig: InteractiveMapClientConfigJson;
}): ReactElement {
	const Adapter = clientConfig.provider === "google" ? GoogleInteractiveMap : MapboxInteractiveMap;

	return (
		<Suspense fallback={<MapLoadingSkeleton />}>
			<Adapter {...props} config={clientConfig} />
		</Suspense>
	);
}

export function InteractiveSearchZoneMap({
	clientConfig,
	...props
}: InteractiveSearchZoneMapAllProps): ReactElement {
	const fetchedConfigState = useInteractiveMapClientConfig();
	const configState = clientConfig
		? ({ status: "ready" as const, config: clientConfig })
		: fetchedConfigState;

	if (configState.status === "loading") {
		return <MapLoadingSkeleton />;
	}

	if (configState.status === "unavailable") {
		return <MapFallback message={configState.message} />;
	}

	return <InteractiveSearchZoneMapInner {...props} clientConfig={configState.config} />;
}
