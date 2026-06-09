/** Custom URL scheme for native app deep links (Capacitor). */
export const PLATFORM_DEEP_LINK_SCHEME = "fidelization";

/**
 * Parse `fidelization://join/{slug}` → tenant slug.
 * Also accepts `fidelization://join/{slug}/` and encoded slugs.
 */
export function parseJoinDeepLink(url: string): string | null {
	try {
		const parsed = new URL(url.trim());

		if (parsed.protocol !== `${PLATFORM_DEEP_LINK_SCHEME}:`) {
			return null;
		}

		if (parsed.hostname !== "join") {
			return null;
		}

		const slug = decodeURIComponent(parsed.pathname.replace(/^\/+/, "").split("/")[0] ?? "")
			.trim()
			.toLowerCase();

		return slug === "" ? null : slug;
	} catch {
		return null;
	}
}
