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
		if (setCookie?.includes("Domain=.localhost")) {
			console.error("   Cookie inválida (Domain=.localhost). Reinicia el servidor tras el fix.");
		}
		process.exit(1);
	}

	if (setCookie?.includes("Domain=")) {
		console.error("❌ Set-Cookie no debe incluir Domain en localhost:", setCookie);
		process.exit(1);
	}

	console.log("✅ Platform login OK, cookie sin Domain");

	const platform = await fetch(`${baseUrl}/platform`, {
		headers: { cookie: `session=${session}` },
		redirect: "manual",
	});

	if (platform.status === 307 || platform.status === 308) {
		const location = platform.headers.get("location") ?? "";
		if (location.includes("/platform/login")) {
			console.error("❌ GET /platform redirige a login — middleware no acepta la sesión");
			process.exit(1);
		}
	}

	if (platform.status !== 200) {
		console.error("❌ GET /platform:", platform.status);
		process.exit(1);
	}

	console.log("✅ GET /platform 200 con sesión");
}

void main();
