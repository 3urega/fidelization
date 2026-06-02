import { env } from "./lib/env";

export function register(): void {
	if (process.env.NEXT_RUNTIME !== "nodejs") {
		return;
	}

	if (!env.isProduction) {
		return;
	}

	const missing = env.validateProduction();

	if (missing.length > 0) {
		// eslint-disable-next-line no-console
		console.warn("[instrumentation] Producción: faltan variables críticas:", missing.join(", "));
	}
}
