"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { type ReactElement, useEffect, useRef } from "react";

import {
	DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	mapLatLngNearlyEqual,
	toGoogleLatLngLiteral,
} from "../../../../lib/maps/mapCenterUtils";
import { MapCenterPin } from "./MapCenterPin";
import type { InteractiveMapAdapterProps } from "./types";

type GoogleMapsNamespace = typeof google.maps;
type GoogleMapInstance = google.maps.Map;
type GoogleMarkerInstance = google.maps.Marker;

export function GoogleInteractiveMap({
	center,
	zoom = DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	onCenterChange,
	markers = [],
	interactive = true,
	className,
	config,
}: InteractiveMapAdapterProps): ReactElement {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<GoogleMapInstance | null>(null);
	const googleMapsRef = useRef<GoogleMapsNamespace | null>(null);
	const markerRefs = useRef<GoogleMarkerInstance[]>([]);
	const isFlyingRef = useRef(false);
	const centerRef = useRef(center);
	const onCenterChangeRef = useRef(onCenterChange);

	centerRef.current = center;
	onCenterChangeRef.current = onCenterChange;

	useEffect(() => {
		let disposed = false;
		let resizeObserver: ResizeObserver | null = null;

		async function initMap(): Promise<void> {
			if (!containerRef.current) {
				return;
			}

			const loader = new Loader({
				apiKey: config.publicToken,
				version: "weekly",
				language: config.language ?? "es",
			});

			const google = await loader.load();
			googleMapsRef.current = google.maps;

			if (disposed || !containerRef.current) {
				return;
			}

			const map = new google.maps.Map(containerRef.current, {
				center: toGoogleLatLngLiteral(centerRef.current),
				zoom,
				disableDefaultUI: true,
				zoomControl: interactive,
				gestureHandling: interactive ? "greedy" : "none",
				draggable: interactive,
				scrollwheel: interactive,
				...(config.mapId ? { mapId: config.mapId } : {}),
			});

			mapRef.current = map;

			const resizeMap = (): void => {
				google.maps.event.trigger(map, "resize");
			};

			resizeMap();
			requestAnimationFrame(resizeMap);

			resizeObserver =
				typeof ResizeObserver !== "undefined" && containerRef.current
					? new ResizeObserver(resizeMap)
					: null;
			resizeObserver?.observe(containerRef.current);

			const emitCenterIfChanged = (): void => {
				if (isFlyingRef.current) {
					return;
				}

				const mapCenter = map.getCenter();
				if (!mapCenter) {
					return;
				}

				const nextCenter = {
					latitude: mapCenter.lat(),
					longitude: mapCenter.lng(),
				};

				if (mapLatLngNearlyEqual(nextCenter, centerRef.current)) {
					return;
				}

				onCenterChangeRef.current?.(nextCenter);
			};

			map.addListener("idle", emitCenterIfChanged);
			map.addListener("dragend", emitCenterIfChanged);
		}

		void initMap();

		return () => {
			disposed = true;
			resizeObserver?.disconnect();
			for (const marker of markerRefs.current) {
				marker.setMap(null);
			}
			markerRefs.current = [];
			mapRef.current = null;
		};
	}, [config.language, config.mapId, config.publicToken, interactive, zoom]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) {
			return;
		}

		const mapCenter = map.getCenter();
		if (!mapCenter) {
			return;
		}

		const currentCenter = {
			latitude: mapCenter.lat(),
			longitude: mapCenter.lng(),
		};

		if (mapLatLngNearlyEqual(currentCenter, center)) {
			return;
		}

		isFlyingRef.current = true;
		map.panTo(toGoogleLatLngLiteral(center));
		map.setZoom(zoom);

		const listener = map.addListener("idle", () => {
			isFlyingRef.current = false;
			googleMapsRef.current?.event.removeListener(listener);
		});
	}, [center, zoom]);

	useEffect(() => {
		const map = mapRef.current;
		const googleMaps = googleMapsRef.current;
		if (!map || !googleMaps) {
			return;
		}

		for (const marker of markerRefs.current) {
			marker.setMap(null);
		}
		markerRefs.current = [];

		for (const item of markers) {
			const marker = new googleMaps.Marker({
				map,
				position: { lat: item.latitude, lng: item.longitude },
				title: item.name,
			});

			markerRefs.current.push(marker);
		}
	}, [markers]);

	return (
		<div
			className={`relative w-full overflow-hidden rounded-theme border border-border bg-surface ${className ?? "h-[220px]"}`}
		>
			<div ref={containerRef} className="absolute inset-0 h-full w-full" />
			<MapCenterPin />
		</div>
	);
}
