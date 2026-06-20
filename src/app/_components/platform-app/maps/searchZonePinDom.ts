const SEARCH_ZONE_PIN_PATH =
	"M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0Z";

export type SearchZonePinElement = {
	root: HTMLElement;
};

export function createSearchZonePinElement(): SearchZonePinElement {
	const root = document.createElement("div");
	root.className = "pointer-events-none drop-shadow-sm";
	root.setAttribute("aria-hidden", "true");
	root.innerHTML = `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="${SEARCH_ZONE_PIN_PATH}" fill="var(--color-primary)"/>
		<circle cx="14" cy="14" r="5" fill="var(--color-background)"/>
	</svg>`;

	return { root };
}

export function buildSearchZonePinIconDataUrl(): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" fill="none">
		<path d="${SEARCH_ZONE_PIN_PATH}" fill="%232563eb"/>
		<circle cx="14" cy="14" r="5" fill="%23fafafa"/>
	</svg>`;

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
