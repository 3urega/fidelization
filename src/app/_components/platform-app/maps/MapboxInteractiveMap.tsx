"use client";

import { type ReactElement, useEffect, useRef } from "react";

import {
	DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	fromMapboxLngLat,
	mapLatLngNearlyEqual,
	toMapboxLngLat,
} from "../../../../lib/maps/mapCenterUtils";
import { MapCenterPin } from "./MapCenterPin";
import type { InteractiveMapAdapterProps } from "./types";

const DEFAULT_MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

export function MapboxInteractiveMap({
	center,
	zoom = DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	onCenterChange,
	markers = [],
	interactive = true,
	className,
	config,
}: InteractiveMapAdapterProps): ReactElement {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<import("mapbox-gl").Map | null>(null);
	const markerRefs = useRef<import("mapbox-gl").Marker[]>([]);
	const isFlyingRef = useRef(false);
	const centerRef = useRef(center);
	const onCenterChangeRef = useRef(onCenterChange);

	centerRef.current = center;
	onCenterChangeRef.current = onCenterChange;

	useEffect(() => {
		let disposed = false;

		async function initMap(): Promise<void> {
			if (!containerRef.current) {
				return;
			}

			const mapboxModule = await import("mapbox-gl");
			await import("mapbox-gl/dist/mapbox-gl.css");

			if (disposed || !containerRef.current) {
				return;
			}

			const mapboxgl = mapboxModule.default;
			mapboxgl.accessToken = config.publicToken;

			const map = new mapboxgl.Map({
				container: containerRef.current,
				style: config.mapId ?? DEFAULT_MAPBOX_STYLE,
				center: toMapboxLngLat(centerRef.current),
				zoom,
				attributionControl: false,
				dragPan: interactive,
				scrollZoom: interactive,
				boxZoom: interactive,
				dragRotate: false,
				keyboard: interactive,
				doubleClickZoom: interactive,
				touchZoomRotate: interactive,
				...(config.language ? { locale: config.language } : {}),
			});

			map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
			mapRef.current = map;

			const emitCenterIfChanged = (): void => {
				if (isFlyingRef.current) {
					return;
				}

				const mapCenter = map.getCenter();
				const nextCenter = fromMapboxLngLat(mapCenter.lng, mapCenter.lat);

				if (mapLatLngNearlyEqual(nextCenter, centerRef.current)) {
					return;
				}

				onCenterChangeRef.current?.(nextCenter);
			};

			map.on("moveend", emitCenterIfChanged);
			map.on("dragend", emitCenterIfChanged);
		}

		void initMap();

		return () => {
			disposed = true;
			for (const marker of markerRefs.current) {
				marker.remove();
			}
			markerRefs.current = [];
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, [config.language, config.mapId, config.publicToken, interactive, zoom]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) {
			return;
		}

		map.dragPan.enable();
		map.scrollZoom.enable();
		map.boxZoom.enable();
		map.doubleClickZoom.enable();
		map.touchZoomRotate.enable();
		map.keyboard.enable();

		if (!interactive) {
			map.dragPan.disable();
			map.scrollZoom.disable();
			map.boxZoom.disable();
			map.doubleClickZoom.disable();
			map.touchZoomRotate.disable();
			map.keyboard.disable();
		}
	}, [interactive]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) {
			return;
		}

		const mapCenter = map.getCenter();
		const currentCenter = fromMapboxLngLat(mapCenter.lng, mapCenter.lat);

		if (mapLatLngNearlyEqual(currentCenter, center)) {
			return;
		}

		isFlyingRef.current = true;
		map.flyTo({
			center: toMapboxLngLat(center),
			zoom,
			essential: true,
		});

		const handleMoveEnd = (): void => {
			isFlyingRef.current = false;
			map.off("moveend", handleMoveEnd);
		};

		map.on("moveend", handleMoveEnd);
	}, [center, zoom]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) {
			return;
		}

		for (const marker of markerRefs.current) {
			marker.remove();
		}
		markerRefs.current = [];

		if (markers.length === 0) {
			return;
		}

		void import("mapbox-gl").then((mapboxModule) => {
			const mapboxgl = mapboxModule.default;

			for (const item of markers) {
				const el = document.createElement("div");
				el.className = "h-3 w-3 rounded-full border-2 border-background bg-secondary shadow-sm";
				el.title = item.name;

				const marker = new mapboxgl.Marker({ element: el })
					.setLngLat([item.longitude, item.latitude])
					.addTo(map);

				markerRefs.current.push(marker);
			}
		});
	}, [markers]);

	return (
		<div className={`relative min-h-[220px] w-full overflow-hidden rounded-theme border border-border bg-surface ${className ?? ""}`}>
			<div ref={containerRef} className="absolute inset-0" />
			<MapCenterPin />
		</div>
	);
}
