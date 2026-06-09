import { Capacitor } from "@capacitor/core";

function normalizeApiPath(path: string): string {
	return path.startsWith("/") ? path : `/${path}`;
}

function shouldUseRemoteApiBase(): boolean {
	if (process.env.NEXT_PUBLIC_CAPACITOR_STATIC === "1") {
		return true;
	}

	return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * Static Capacitor shell has no Next API routes — prefix with NEXT_PUBLIC_API_URL when native/static.
 */
export function resolvePlatformApiUrl(path: string): string {
	const normalizedPath = normalizeApiPath(path);
	const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

	if (!apiBase || !shouldUseRemoteApiBase()) {
		return normalizedPath;
	}

	return `${apiBase}${normalizedPath}`;
}

export function platformFetch(path: string, init: RequestInit = {}): Promise<Response> {
	return fetch(resolvePlatformApiUrl(path), {
		credentials: "include",
		...init,
	});
}
