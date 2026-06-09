/* eslint-disable no-console -- CLI verify script */

/**
 * Production session cookie: shared Domain across apex + tenant subdomains.
 * Local dev must remain host-only (no Domain attribute).
 */
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "verify-secret-min-16-chars";

async function runProductionChecks(): Promise<void> {
	const env = process.env as Record<string, string | undefined>;
	env.NODE_ENV = "production";
	env.APP_DOMAIN = "platform.example.com";
	delete env.SESSION_COOKIE_DOMAIN;

	const { buildSessionCookie, clearSessionCookie } = await import("../src/lib/auth/session");

	const setCookie = buildSessionCookie("test-token");
	if (!setCookie.includes("Domain=.platform.example.com")) {
		console.error("❌ Production Set-Cookie must include Domain=.platform.example.com:", setCookie);
		process.exit(1);
	}
	if (!setCookie.includes("Secure")) {
		console.error("❌ Production Set-Cookie must include Secure");
		process.exit(1);
	}

	const cleared = clearSessionCookie();
	if (!cleared.includes("Domain=.platform.example.com")) {
		console.error("❌ Clear cookie must include same Domain");
		process.exit(1);
	}

	env.SESSION_COOKIE_DOMAIN = "custom.example.com";
	const overrideCookie = buildSessionCookie("t");
	if (!overrideCookie.includes("Domain=.custom.example.com")) {
		console.error("❌ SESSION_COOKIE_DOMAIN override failed");
		process.exit(1);
	}

	console.log("✅ Production session cookie Domain + Secure");
}

async function runDevelopmentChecks(): Promise<void> {
	const env = process.env as Record<string, string | undefined>;
	env.NODE_ENV = "development";
	env.APP_DOMAIN = "localhost";
	delete env.SESSION_COOKIE_DOMAIN;

	const { buildSessionCookie } = await import("../src/lib/auth/session");
	const setCookie = buildSessionCookie("test-token");

	if (setCookie.includes("Domain=")) {
		console.error("❌ Dev Set-Cookie must not set Domain:", setCookie);
		process.exit(1);
	}

	console.log("✅ Development session cookie host-only (no Domain)");
}

async function runRedirectChecks(): Promise<void> {
	const { resolveTenantHomeUrl, isLocalDevApexHost } = await import(
		"../src/lib/tenant/resolveTenantHomeUrl"
	);

	if (!isLocalDevApexHost("localhost")) {
		console.error("❌ isLocalDevApexHost(localhost)");
		process.exit(1);
	}

	process.env.NEXT_PUBLIC_APP_DOMAIN = "platform.example.com";

	const originalWindow = globalThis.window;

	globalThis.window = {
		location: {
			protocol: "https:",
			port: "",
			hostname: "platform.example.com",
		},
	} as Window & typeof globalThis;

	if (resolveTenantHomeUrl("cafe-joan") !== "https://cafe-joan.platform.example.com/panel") {
		console.error("❌ resolveTenantHomeUrl production apex");
		process.exit(1);
	}

	globalThis.window = {
		location: {
			protocol: "http:",
			port: "3000",
			hostname: "localhost",
		},
	} as Window & typeof globalThis;

	if (resolveTenantHomeUrl("cafe-joan") !== "/panel") {
		console.error("❌ resolveTenantHomeUrl local apex must stay on /panel");
		process.exit(1);
	}

	globalThis.window = originalWindow;

	console.log("✅ resolveTenantHomeUrl prod vs local apex");
}

async function main(): Promise<void> {
	await runProductionChecks();
	await runDevelopmentChecks();
	await runRedirectChecks();
	console.log("✅ verify:session-cookie-prod passed");
}

void main();
