import "dotenv/config";

/**
 * E2E check: tenant session cookie is set and /home is reachable (not redirected to /login).
 * Uses demo login by default; set OWNER_VERIFY_EMAIL + OWNER_VERIFY_PASSWORD for password login.
 */
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function parseSetCookieSession(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function login(): Promise<{ cookie: string; body: { tenant?: { slug: string } } }> {
	const email = process.env.OWNER_VERIFY_EMAIL?.trim();
	const password = process.env.OWNER_VERIFY_PASSWORD;

	if (email && password) {
		const response = await fetch(`${baseUrl}/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		const body = (await response.json()) as {
			error?: { description?: string };
			tenant?: { slug: string };
		};
		const setCookie = response.headers.get("set-cookie");
		const cookie = parseSetCookieSession(setCookie);

		if (!response.ok || !cookie) {
			console.error("❌ POST /api/auth/login:", response.status, body.error?.description ?? body);
			process.exit(1);
		}

		return { cookie, body };
	}

	const response = await fetch(`${baseUrl}/api/auth/demo`, { method: "POST" });
	const body = (await response.json()) as {
		error?: { description?: string };
		tenant?: { slug: string };
	};
	const setCookie = response.headers.get("set-cookie");
	const cookie = parseSetCookieSession(setCookie);

	if (!response.ok || !cookie) {
		console.error("❌ POST /api/auth/demo:", response.status, body.error?.description ?? body);
		process.exit(1);
	}

	return { cookie, body };
}

async function main(): Promise<void> {
	const { cookie, body } = await login();
	console.log("✅ Login OK, session cookie set");
	if (body.tenant?.slug) {
		console.log(`   tenant slug: ${body.tenant.slug}`);
	}

	const home = await fetch(`${baseUrl}/home`, {
		headers: { cookie: `session=${cookie}` },
		redirect: "manual",
	});

	if (home.status === 307 || home.status === 308) {
		const location = home.headers.get("location") ?? "";
		if (location.includes("/login")) {
			console.error("❌ GET /home redirected to login — middleware did not accept session");
			process.exit(1);
		}
	}

	if (home.status !== 200) {
		console.error("❌ GET /home:", home.status);
		process.exit(1);
	}

	console.log("✅ GET /home 200 with session (no redirect to /login)");

	const me = await fetch(`${baseUrl}/api/me`, { headers: { cookie: `session=${cookie}` } });
	if (!me.ok) {
		console.error("❌ GET /api/me:", me.status);
		process.exit(1);
	}

	console.log("✅ GET /api/me 200");
}

void main();
