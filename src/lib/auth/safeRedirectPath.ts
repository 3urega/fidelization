const ALLOWED_REDIRECT_PREFIXES = ["/u/"] as const;

/** Allows same-origin app paths only (prevents open redirects). */
export function safeRedirectPath(value: string | null | undefined): string | null {
	if (!value || !value.startsWith("/") || value.startsWith("//")) {
		return null;
	}

	if (!ALLOWED_REDIRECT_PREFIXES.some((prefix) => value === prefix || value.startsWith(prefix))) {
		return null;
	}

	return value;
}
