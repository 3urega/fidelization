import "dotenv/config";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const email = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const password = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function main(): Promise<void> {
	const login = await fetch(`${baseUrl}/api/platform/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	const body = (await login.json()) as { error?: { description?: string } };
	const setCookie = login.headers.get("set-cookie");
	const session = parseSessionCookie(setCookie);

	if (!login.ok || !session) {
		console.error("❌ POST /api/platform/auth/login:", login.status, body.error?.description ?? body);
		process.exit(1);
	}

	if (setCookie?.includes("Domain=")) {
		console.error("❌ Set-Cookie no debe incluir Domain en localhost:", setCookie);
		process.exit(1);
	}

	console.log("✅ Platform login OK");

	const cookieHeader = { cookie: `session=${session}` };

	const platform = await fetch(`${baseUrl}/platform`, {
		headers: cookieHeader,
		redirect: "manual",
	});

	if (platform.status !== 200) {
		console.error("❌ GET /platform:", platform.status);
		process.exit(1);
	}

	console.log("✅ GET /platform 200 con sesión platform");

	const tenantMe = await fetch(`${baseUrl}/api/me`, { headers: cookieHeader });

	if (tenantMe.status !== 401) {
		console.error("❌ GET /api/me con sesión platform debe ser 401, obtuvo:", tenantMe.status);
		process.exit(1);
	}

	console.log("✅ GET /api/me 401 — sin datos de tenant");

	const home = await fetch(`${baseUrl}/home`, {
		headers: cookieHeader,
		redirect: "manual",
	});

	if (home.status === 307 || home.status === 308) {
		const location = home.headers.get("location") ?? "";
		if (location.includes("/platform")) {
			console.log("✅ GET /home redirige a /platform (aislamiento middleware)");

			return;
		}
		if (location.includes("/login")) {
			console.error("❌ GET /home redirige a /login en lugar de /platform");
			process.exit(1);
		}
	}

	if (home.status === 401 || home.status === 403) {
		console.log("✅ GET /home bloqueado con sesión platform:", home.status);

		return;
	}

	console.error("❌ GET /home con sesión platform:", home.status);
	process.exit(1);
}

void main();
