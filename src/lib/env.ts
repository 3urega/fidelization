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

	/** Future subdomain routing: apex domain for tenant hosts (e.g. app.fidelizacion.com). */
	get appDomain(): string | undefined {
		return optionalEnv("APP_DOMAIN");
	},

	get allowDemoBilling(): boolean {
		return process.env.ALLOW_DEMO_BILLING === "1";
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

		return missing;
	},
};
