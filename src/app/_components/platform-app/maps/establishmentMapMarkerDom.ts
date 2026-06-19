import { shouldShowEstablishmentMarkerLabel } from "../../../../lib/maps/mapCenterUtils";
import { platformRoutes } from "../../../../lib/platform/routes";

const ESTABLISHMENT_PIN_PATH =
	"M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0Z";

const MAP_GESTURE_BLOCK_EVENTS = ["mousedown", "touchstart", "pointerdown"] as const;

export type EstablishmentMapMarkerElement = {
	root: HTMLElement;
	setLabelVisible: (visible: boolean) => void;
};

export type EstablishmentMapMarkerLabelHandle = {
	setLabelVisible: (visible: boolean) => void;
};

export function getEstablishmentMapMarkerHref(slug: string): string {
	return platformRoutes.homeEstablishment(slug);
}

function blockMapGestureOnLink(link: HTMLAnchorElement): void {
	for (const eventName of MAP_GESTURE_BLOCK_EVENTS) {
		link.addEventListener(eventName, (event) => {
			event.stopPropagation();
		});
	}
}

export function createEstablishmentMapMarkerElement(
	name: string,
	slug: string,
): EstablishmentMapMarkerElement {
	const root = document.createElement("div");
	root.className = "flex flex-col items-center";

	const link = document.createElement("a");
	link.href = getEstablishmentMapMarkerHref(slug);
	link.className =
		"flex cursor-pointer flex-col items-center text-inherit no-underline hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
	link.setAttribute("aria-label", `Ver ${name}`);
	link.title = name;
	blockMapGestureOnLink(link);

	const pinWrapper = document.createElement("div");
	pinWrapper.className = "drop-shadow-sm";
	pinWrapper.innerHTML = `<svg width="24" height="30" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<path d="${ESTABLISHMENT_PIN_PATH}" fill="var(--color-map-establishment)"/>
		<circle cx="14" cy="14" r="4" fill="var(--color-background)"/>
	</svg>`;

	const label = document.createElement("span");
	label.className =
		"mt-0.5 hidden max-w-[10rem] truncate whitespace-nowrap rounded-theme border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-foreground shadow-sm pointer-events-none";
	label.textContent = name;

	link.appendChild(pinWrapper);
	link.appendChild(label);
	root.appendChild(link);

	return {
		root,
		setLabelVisible(visible: boolean): void {
			label.classList.toggle("hidden", !visible);
		},
	};
}

export function buildEstablishmentPinIconDataUrl(): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="30" viewBox="0 0 28 36" fill="none">
		<path d="${ESTABLISHMENT_PIN_PATH}" fill="%2316a34a"/>
		<circle cx="14" cy="14" r="4" fill="%23fafafa"/>
	</svg>`;

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function syncEstablishmentMarkerLabels(
	handles: EstablishmentMapMarkerLabelHandle[],
	zoom: number,
): void {
	const showLabel = shouldShowEstablishmentMarkerLabel(zoom);

	for (const handle of handles) {
		handle.setLabelVisible(showLabel);
	}
}
