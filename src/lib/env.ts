import { parseGeocodingProvider, type GeocodingProviderId } from "../contexts/shared/geocoding/domain/GeocodingProvider";

function requireEnv(name: string, minLength?: number): string {
	const value = process.env[name]?.trim();

	if (!value) {
		throw new Error(`${name} must be set`);
	}

	if (minLength !== undefined && value.length < minLength) {
		throw new Error(`${name} must be at least ${minLength} characters`);
	}

	return value;
}

function optionalEnv(name: string): string | undefined {
	const value = process.env[name]?.trim();

	return value === "" || value === undefined ? undefined : value;
}

/** Centralized environment access for server/runtime code. */
export const env = {
	get nodeEnv(): string {
		const nodeEnv = process.env.NODE_ENV;

		return nodeEnv === undefined ? "development" : nodeEnv;
	},

	get isProduction(): boolean {
		return env.nodeEnv === "production";
	},

	get authSecret(): string {
		return requireEnv("AUTH_SECRET", 16);
	},

	get databaseUrl(): string {
		return requireEnv("DATABASE_URL");
	},

	get nextPublicApiUrl(): string {
		return optionalEnv("NEXT_PUBLIC_API_URL") ?? "http://localhost:3000";
	},

	/** Google OAuth client ID (Web) for platform app sign-in. */
	get googleClientId(): string | undefined {
		return optionalEnv("GOOGLE_CLIENT_ID");
	},

	/** Future subdomain routing: apex domain for tenant hosts (e.g. app.fidelizacion.com). */
	get appDomain(): string | undefined {
		return optionalEnv("APP_DOMAIN");
	},

	/**
	 * Shared session cookie domain for apex + tenant subdomains (production only).
	 * Defaults to `.${APP_DOMAIN}` when APP_DOMAIN is set; override with SESSION_COOKIE_DOMAIN.
	 */
	get sessionCookieDomain(): string | undefined {
		if (!env.isProduction) {
			return undefined;
		}

		const explicit = optionalEnv("SESSION_COOKIE_DOMAIN");
		if (explicit) {
			return explicit.startsWith(".") ? explicit : `.${explicit}`;
		}

		const appDomain = optionalEnv("APP_DOMAIN");
		if (!appDomain) {
			return undefined;
		}

		return `.${appDomain.replace(/^\./, "")}`;
	},

	get allowDemoBilling(): boolean {
		return process.env.ALLOW_DEMO_BILLING === "1";
	},

	/**
	 * Dev/staging only: skip tenant plan feature gates and employee limits (UI + API).
	 * Ignored in production even if set.
	 */
	get disableTenantPlanGates(): boolean {
		return !env.isProduction && process.env.DISABLE_TENANT_PLAN_GATES === "1";
	},

	/** Calendar day boundaries for owner analytics (IANA timezone). */
	get appTimezone(): string {
		return optionalEnv("APP_TIMEZONE") ?? "Europe/Madrid";
	},

	get stripeSecretKey(): string {
		return requireEnv("STRIPE_SECRET_KEY");
	},

	get stripeWebhookSecret(): string | undefined {
		return optionalEnv("STRIPE_WEBHOOK_SECRET");
	},

	/** Active geocoding provider (default mapbox). */
	get geocodingProvider(): GeocodingProviderId {
		return parseGeocodingProvider(optionalEnv("GEOCODING_PROVIDER"));
	},

	/** Mapbox secret access token (server-side geocoding). */
	get mapboxAccessToken(): string | undefined {
		return optionalEnv("MAPBOX_ACCESS_TOKEN");
	},

	/** Google Maps Geocoding API key (server-side). */
	get googleMapsGeocodingApiKey(): string | undefined {
		return optionalEnv("GOOGLE_MAPS_GEOCODING_API_KEY");
	},

	/** Warn in production boot when critical vars are missing (non-throwing). */
	validateProduction(): string[] {
		const missing: string[] = [];

		try {
			env.authSecret;
		} catch {
			missing.push("AUTH_SECRET (min 16 chars)");
		}

		if (!optionalEnv("DATABASE_URL")) {
			missing.push("DATABASE_URL");
		}

		if (!optionalEnv("APP_DOMAIN")) {
			missing.push("APP_DOMAIN (tenant subdomain resolution)");
		}

		if (optionalEnv("APP_DOMAIN") && !optionalEnv("NEXT_PUBLIC_APP_DOMAIN")) {
			missing.push("NEXT_PUBLIC_APP_DOMAIN (must match APP_DOMAIN for post-login redirect)");
		}

		return missing;
	},
};
