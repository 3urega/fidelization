"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { type ReactElement, useEffect, useRef } from "react";

import {
	DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	mapLatLngNearlyEqual,
	shouldShowEstablishmentMarkerLabel,
	toGoogleLatLngLiteral,
} from "../../../../lib/maps/mapCenterUtils";
import {
	buildEstablishmentPinIconDataUrl,
	createEstablishmentMapMarkerElement,
	getEstablishmentMapMarkerHref,
	syncEstablishmentMarkerLabels,
	type EstablishmentMapMarkerLabelHandle,
} from "./establishmentMapMarkerDom";
import { MapCenterPin } from "./MapCenterPin";
import type { EstablishmentMapMarker, InteractiveMapAdapterProps } from "./types";

type GoogleMapsNamespace = typeof google.maps;
type GoogleMapInstance = google.maps.Map;
type GoogleAdvancedMarkerElement = google.maps.marker.AdvancedMarkerElement;
type GoogleClassicMarker = google.maps.Marker;

type GoogleEstablishmentMarkerEntry =
	| {
			kind: "advanced";
			marker: GoogleAdvancedMarkerElement;
			setLabelVisible: (visible: boolean) => void;
	  }
	| {
			kind: "classic";
			marker: GoogleClassicMarker;
			name: string;
			slug: string;
	  };

export function GoogleInteractiveMap({
	center,
	zoom = DEFAULT_SEARCH_ZONE_MAP_ZOOM,
	onCenterChange,
	onUserGestureStart,
	markers = [],
	interactive = true,
	className,
	config,
}: InteractiveMapAdapterProps): ReactElement {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<GoogleMapInstance | null>(null);
	const googleMapsRef = useRef<GoogleMapsNamespace | null>(null);
	const establishmentMarkerEntriesRef = useRef<GoogleEstablishmentMarkerEntry[]>([]);
	const isFlyingRef = useRef(false);
	const isUserGesturingRef = useRef(false);
	const centerRef = useRef(center);
	const onCenterChangeRef = useRef(onCenterChange);
	const onUserGestureStartRef = useRef(onUserGestureStart);

	centerRef.current = center;
	onCenterChangeRef.current = onCenterChange;
	onUserGestureStartRef.current = onUserGestureStart;

	function syncGoogleEstablishmentMarkerLabels(mapZoom: number): void {
		const showLabel = shouldShowEstablishmentMarkerLabel(mapZoom);
		const advancedHandles: EstablishmentMapMarkerLabelHandle[] = [];

		for (const entry of establishmentMarkerEntriesRef.current) {
			if (entry.kind === "advanced") {
				advancedHandles.push({ setLabelVisible: entry.setLabelVisible });
				continue;
			}

			entry.marker.setLabel(
				showLabel
					? {
							text: entry.name,
							color: "var(--color-foreground)",
							fontSize: "11px",
							fontWeight: "500",
						}
					: null,
			);
		}

		syncEstablishmentMarkerLabels(advancedHandles, mapZoom);
	}

	function clearEstablishmentMarkers(): void {
		for (const entry of establishmentMarkerEntriesRef.current) {
			if (entry.kind === "advanced") {
				entry.marker.map = null;
				continue;
			}

			entry.marker.setMap(null);
		}

		establishmentMarkerEntriesRef.current = [];
	}

	async function renderEstablishmentMarkers(
		map: GoogleMapInstance,
		googleMaps: GoogleMapsNamespace,
		markerItems: EstablishmentMapMarker[],
	): Promise<void> {
		clearEstablishmentMarkers();

		if (markerItems.length === 0) {
			return;
		}

		const iconUrl = buildEstablishmentPinIconDataUrl();
		let AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement | null = null;

		try {
			const markerLibrary = (await googleMaps.importLibrary("marker")) as google.maps.MarkerLibrary;
			AdvancedMarkerElement = markerLibrary.AdvancedMarkerElement;
		} catch {
			AdvancedMarkerElement = null;
		}

		const entries: GoogleEstablishmentMarkerEntry[] = [];

		for (const item of markerItems) {
			const position = { lat: item.latitude, lng: item.longitude };

			if (AdvancedMarkerElement) {
				const { root, setLabelVisible } = createEstablishmentMapMarkerElement(item.name, item.slug);
				const marker = new AdvancedMarkerElement({
					map,
					position,
					content: root,
					gmpClickable: true,
				});

				entries.push({ kind: "advanced", marker, setLabelVisible });
				continue;
			}

			const marker = new googleMaps.Marker({
				map,
				position,
				title: item.name,
				icon: {
					url: iconUrl,
					anchor: new googleMaps.Point(12, 30),
					scaledSize: new googleMaps.Size(24, 30),
				},
			});

			marker.addListener("click", () => {
				window.location.assign(getEstablishmentMapMarkerHref(item.slug));
			});

			entries.push({ kind: "classic", marker, name: item.name, slug: item.slug });
		}

		establishmentMarkerEntriesRef.current = entries;
		syncGoogleEstablishmentMarkerLabels(map.getZoom() ?? zoom);
	}

	useEffect(() => {
		let disposed = false;
		let resizeObserver: ResizeObserver | null = null;
		let zoomListener: google.maps.MapsEventListener | null = null;

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

			map.addListener("dragstart", notifyUserGesture);
			map.addListener("zoomstart", notifyUserGesture);
			zoomListener = map.addListener("zoom_changed", () => {
				syncGoogleEstablishmentMarkerLabels(map.getZoom() ?? zoom);
			});
			map.addListener("idle", () => {
				emitCenterIfChanged();
				finishUserGesture();
			});
			map.addListener("dragend", emitCenterIfChanged);

			const mapCenter = map.getCenter();
			if (mapCenter) {
				const currentCenter = {
					latitude: mapCenter.lat(),
					longitude: mapCenter.lng(),
				};

				if (!mapLatLngNearlyEqual(currentCenter, centerRef.current)) {
					isFlyingRef.current = true;
					map.panTo(toGoogleLatLngLiteral(centerRef.current));

					const initListener = map.addListener("idle", () => {
						isFlyingRef.current = false;
						google.maps.event.removeListener(initListener);
					});
				}
			}
		}

		void initMap();

		return () => {
			disposed = true;
			resizeObserver?.disconnect();
			if (zoomListener) {
				googleMapsRef.current?.event.removeListener(zoomListener);
			}
			clearEstablishmentMarkers();
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

		const listener = map.addListener("idle", () => {
			isFlyingRef.current = false;
			googleMapsRef.current?.event.removeListener(listener);
		});
	}, [center.latitude, center.longitude]);

	useEffect(() => {
		const map = mapRef.current;
		const googleMaps = googleMapsRef.current;
		if (!map || !googleMaps) {
			return;
		}

		void renderEstablishmentMarkers(map, googleMaps, markers);
	}, [markers]);

	return (
		<div
			className={`relative w-full touch-none overscroll-contain overflow-hidden rounded-theme border border-border bg-surface ${className ?? "h-[220px]"}`}
		>
			<div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />
			<MapCenterPin />
		</div>
	);
}
