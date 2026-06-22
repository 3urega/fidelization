import type { PlatformIntegrationStatus } from "../../contexts/platform/domain/PlatformIntegrationStatus";

function readEnv(name: string): string | undefined {
	const value = process.env[name]?.trim();

	return value === "" || value === undefined ? undefined : value;
}

function isAuthSecretConfigured(): boolean {
	const value = readEnv("AUTH_SECRET");

	return value !== undefined && value.length >= 16;
}

function isStripeGroupConfigured(items: Array<{ configured: boolean }>): boolean {
	return items.every((item) => item.configured);
}

/** Server-side integration checklist for platform settings (never exposes secret values). */
export function buildPlatformIntegrationStatus(): PlatformIntegrationStatus {
	const stripeItems = [
		{
			key: "stripeSecretKey",
			label: "STRIPE_SECRET_KEY",
			configured: readEnv("STRIPE_SECRET_KEY") !== undefined,
		},
		{
			key: "stripeWebhookSecret",
			label: "STRIPE_WEBHOOK_SECRET",
			configured: readEnv("STRIPE_WEBHOOK_SECRET") !== undefined,
		},
		{
			key: "stripePricePro",
			label: "STRIPE_PRICE_PRO_MONTHLY",
			configured: readEnv("STRIPE_PRICE_PRO_MONTHLY") !== undefined,
		},
		{
			key: "stripePricePremium",
			label: "STRIPE_PRICE_PREMIUM_MONTHLY",
			configured: readEnv("STRIPE_PRICE_PREMIUM_MONTHLY") !== undefined,
		},
	];

	const googleItems = [
		{
			key: "googleClientId",
			label: "GOOGLE_CLIENT_ID",
			configured: readEnv("GOOGLE_CLIENT_ID") !== undefined,
		},
		{
			key: "nextPublicGoogleClientId",
			label: "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
			configured: readEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID") !== undefined,
		},
	];

	const appDomain = readEnv("APP_DOMAIN");
	const nextPublicAppDomain = readEnv("NEXT_PUBLIC_APP_DOMAIN");
	const appDomainItems = [
		{
			key: "appDomain",
			label: "APP_DOMAIN",
			configured: appDomain !== undefined,
		},
		{
			key: "nextPublicAppDomain",
			label: "NEXT_PUBLIC_APP_DOMAIN",
			configured: nextPublicAppDomain !== undefined,
			hint:
				appDomain !== undefined && nextPublicAppDomain === undefined
					? "Recomendado para redirects post-login"
					: undefined,
		},
	];

	return {
		groups: [
			{
				key: "auth",
				label: "Autenticación",
				configured: isAuthSecretConfigured(),
				items: [
					{
						key: "authSecret",
						label: "AUTH_SECRET",
						configured: isAuthSecretConfigured(),
						hint: isAuthSecretConfigured() ? undefined : "Mínimo 16 caracteres",
					},
				],
			},
			{
				key: "stripe",
				label: "Stripe",
				configured: isStripeGroupConfigured(stripeItems),
				items: stripeItems,
			},
			{
				key: "googleOAuth",
				label: "Google OAuth",
				configured: googleItems.every((item) => item.configured),
				items: googleItems,
			},
			{
				key: "appDomain",
				label: "Dominio app",
				configured: appDomainItems.every((item) => item.configured),
				items: appDomainItems,
			},
			{
				key: "smtp",
				label: "Email (SMTP)",
				configured: false,
				items: [
					{
						key: "smtpTransport",
						label: "SMTP / proveedor email",
						configured: false,
						hint: "Sin SMTP en runtime; broadcasts usan adapter console en dev",
					},
				],
			},
		],
	};
}
