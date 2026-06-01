export function register(): void {
	if (process.env.NEXT_RUNTIME !== "nodejs") {
		return;
	}

	if (process.env.NODE_ENV !== "production") {
		return;
	}

	const missing: string[] = [];
	if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
		missing.push("AUTH_SECRET (min 16 chars)");
	}

	if (missing.length > 0) {
		// eslint-disable-next-line no-console
		console.warn("[instrumentation] Producción: faltan variables críticas:", missing.join(", "));
	}
}
