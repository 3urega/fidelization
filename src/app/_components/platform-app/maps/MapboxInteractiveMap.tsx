"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { type ReactElement, useEffect, useRef } from "react";

import {
	DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	fromMapboxLngLat,
	mapLatLngNearlyEqual,
	toMapboxLngLat,
} from "../../../../lib/maps/mapCenterUtils";
import {
	createEstablishmentMapMarkerElement,
	syncEstablishmentMarkerLabels,
	type EstablishmentMapMarkerLabelHandle,
} from "./establishmentMapMarkerDom";
import { createSearchZonePinElement } from "./searchZonePinDom";
import type { InteractiveMapAdapterProps } from "./types";

const DEFAULT_MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

export function MapboxInteractiveMap({
	center,
	zonePin,
	zoom = DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	onCenterChange,
	onUserGestureStart,
	markers = [],
	interactive = true,
	className,
	config,
}: InteractiveMapAdapterProps): ReactElement {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<import("mapbox-gl").Map | null>(null);
	const markerRefs = useRef<import("mapbox-gl").Marker[]>([]);
	const zonePinMarkerRef = useRef<import("mapbox-gl").Marker | null>(null);
	const establishmentLabelHandlesRef = useRef<EstablishmentMapMarkerLabelHandle[]>([]);
	const isFlyingRef = useRef(false);
	const isUserGesturingRef = useRef(false);
	const centerRef = useRef(center);
	const onCenterChangeRef = useRef(onCenterChange);
	const onUserGestureStartRef = useRef(onUserGestureStart);

	centerRef.current = center;
	onCenterChangeRef.current = onCenterChange;
	onUserGestureStartRef.current = onUserGestureStart;

	useEffect(() => {
		let disposed = false;
		let resizeObserver: ResizeObserver | null = null;

		async function initMap(): Promise<void> {
			if (!containerRef.current) {
				return;
			}

			const mapboxModule = await import("mapbox-gl");

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
				cooperativeGestures: false,
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

			if (interactive) {
				map.dragPan.enable();
				map.scrollZoom.enable();
				map.boxZoom.enable();
				map.doubleClickZoom.enable();
				map.touchZoomRotate.enable();
				map.keyboard.enable();
			}

			const resizeMap = (): void => {
				map.resize();
			};

			map.on("load", resizeMap);
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
				const nextCenter = fromMapboxLngLat(mapCenter.lng, mapCenter.lat);

				if (mapLatLngNearlyEqual(nextCenter, centerRef.current)) {
					return;
				}

				onCenterChangeRef.current?.(nextCenter);
			};

			const notifyUserGesture = (): void => {
				if (isFlyingRef.current) {
					return;
				}

				isUserGesturingRef.current = true;
				onUserGestureStartRef.current?.();
			};

			const finishUserGesture = (): void => {
				if (isFlyingRef.current) {
					return;
				}

				isUserGesturingRef.current = false;
			};

			map.on("dragstart", notifyUserGesture);
			map.on("zoomstart", notifyUserGesture);
			map.on("zoomend", () => {
				finishUserGesture();
				syncEstablishmentMarkerLabels(establishmentLabelHandlesRef.current, map.getZoom());
			});
			map.on("moveend", () => {
				emitCenterIfChanged();
				finishUserGesture();
			});
			map.on("dragend", emitCenterIfChanged);

			const mapCenter = map.getCenter();
			const currentCenter = fromMapboxLngLat(mapCenter.lng, mapCenter.lat);

			if (!mapLatLngNearlyEqual(currentCenter, centerRef.current)) {
				isFlyingRef.current = true;
				map.easeTo({
					center: toMapboxLngLat(centerRef.current),
					essential: true,
				});

				const handleInitMoveEnd = (): void => {
					isFlyingRef.current = false;
					map.off("moveend", handleInitMoveEnd);
				};

				map.on("moveend", handleInitMoveEnd);
			}
		}

		void initMap();

		return () => {
			disposed = true;
			resizeObserver?.disconnect();
			for (const marker of markerRefs.current) {
				marker.remove();
			}
			markerRefs.current = [];
			zonePinMarkerRef.current?.remove();
			zonePinMarkerRef.current = null;
			establishmentLabelHandlesRef.current = [];
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
		map.easeTo({
			center: toMapboxLngLat(center),
			essential: true,
		});

		const handleMoveEnd = (): void => {
			isFlyingRef.current = false;
			map.off("moveend", handleMoveEnd);
		};

		map.on("moveend", handleMoveEnd);
	}, [center.latitude, center.longitude]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) {
			return;
		}

		for (const marker of markerRefs.current) {
			marker.remove();
		}
		markerRefs.current = [];
		establishmentLabelHandlesRef.current = [];

		if (markers.length === 0) {
			return;
		}

		void import("mapbox-gl").then((mapboxModule) => {
			const mapboxgl = mapboxModule.default;
			const labelHandles: EstablishmentMapMarkerLabelHandle[] = [];

			for (const item of markers) {
				const { root, setLabelVisible } = createEstablishmentMapMarkerElement(item.name, item.slug);

				const marker = new mapboxgl.Marker({ element: root, anchor: "bottom" })
					.setLngLat([item.longitude, item.latitude])
					.addTo(map);

				markerRefs.current.push(marker);
				labelHandles.push({ setLabelVisible });
			}

			establishmentLabelHandlesRef.current = labelHandles;
			syncEstablishmentMarkerLabels(labelHandles, map.getZoom());
		});
	}, [markers]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) {
			return;
		}

		if (!zonePin) {
			zonePinMarkerRef.current?.remove();
			zonePinMarkerRef.current = null;
			return;
		}

		void import("mapbox-gl").then((mapboxModule) => {
			if (!mapRef.current) {
				return;
			}

			const mapboxgl = mapboxModule.default;

			if (zonePinMarkerRef.current) {
				zonePinMarkerRef.current.setLngLat([zonePin.longitude, zonePin.latitude]);
				return;
			}

			const { root } = createSearchZonePinElement();
			const marker = new mapboxgl.Marker({ element: root, anchor: "bottom" })
				.setLngLat([zonePin.longitude, zonePin.latitude])
				.addTo(mapRef.current);

			zonePinMarkerRef.current = marker;
		});
	}, [zonePin?.latitude, zonePin?.longitude]);

	return (
		<div
			className={`relative w-full touch-none overscroll-contain overflow-hidden rounded-theme border border-border bg-surface ${className ?? "h-[220px]"}`}
		>
			<div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />
		</div>
	);
}
