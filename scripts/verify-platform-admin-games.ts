/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim() ?? "superadmin@platform.local";
const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";
const DEMO_GAME_RULETA_ID = "00000000-0000-4000-8000-000000000030";

function parseSessionCookie(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

async function platformLogin(): Promise<string> {
	const response = await fetch(`${baseUrl}/api/platform/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: superadminEmail, password: superadminPassword }),
	});

	const session = parseSessionCookie(response.headers.get("set-cookie"));
	if (!response.ok || !session) {
		console.error("❌ platform login failed", response.status);
		process.exit(1);
	}

	return session;
}

async function main(): Promise<void> {
	const platformSession = await platformLogin();
	const platformCookie = { cookie: `session=${platformSession}` };

	const list = await fetch(`${baseUrl}/api/platform/games`, { headers: platformCookie });
	const listBody = (await list.json()) as {
		games?: {
			id?: string;
			slug?: string;
			label?: string;
			status?: string;
		}[];
	};

	if (list.status !== 200 || !Array.isArray(listBody.games)) {
		console.error("❌ GET /api/platform/games", list.status, listBody);
		process.exit(1);
	}

	if (listBody.games.length < 3) {
		console.error("❌ expected at least 3 seeded games", listBody.games.length);
		process.exit(1);
	}

	const ruletaGame = listBody.games.find((row) => row.id === DEMO_GAME_RULETA_ID);
	if (!ruletaGame || ruletaGame.slug !== "ruleta" || ruletaGame.status !== "active") {
		console.error("❌ seeded ruleta game missing or wrong", ruletaGame);
		process.exit(1);
	}

	console.log("✅ GET /api/platform/games → seeded library");

	const gameSlug = `verify-game-${randomUUID().slice(0, 8)}`;
	const create = await fetch(`${baseUrl}/api/platform/games`, {
		method: "POST",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({
			slug: gameSlug,
			label: "Verify game",
			description: "Juego creado por verify E2E",
			status: "beta",
			requiredFeature: "gamification",
		}),
	});
	const createBody = (await create.json()) as {
		game?: { id?: string; slug?: string; status?: string };
	};

	if (
		create.status !== 201 ||
		!createBody.game?.id ||
		createBody.game.slug !== gameSlug ||
		createBody.game.status !== "beta"
	) {
		console.error("❌ POST /api/platform/games", create.status, createBody);
		process.exit(1);
	}

	console.log("✅ POST creates beta game");

	const createdId = createBody.game.id;
	const deactivate = await fetch(`${baseUrl}/api/platform/games/${createdId}`, {
		method: "PATCH",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({ status: "draft" }),
	});
	const deactivateBody = (await deactivate.json()) as {
		game?: { status?: string };
	};

	if (deactivate.status !== 200 || deactivateBody.game?.status !== "draft") {
		console.error("❌ PATCH deactivate game", deactivate.status, deactivateBody);
		process.exit(1);
	}

	console.log("✅ PATCH deactivates game to draft");

	const invalidCreate = await fetch(`${baseUrl}/api/platform/games`, {
		method: "POST",
		headers: { ...platformCookie, "Content-Type": "application/json" },
		body: JSON.stringify({ slug: "bad slug", label: "" }),
	});

	if (invalidCreate.status !== 400) {
		console.error("❌ invalid create expected 400, got", invalidCreate.status);
		process.exit(1);
	}

	console.log("✅ invalid POST → 400");

	const unauth = await fetch(`${baseUrl}/api/platform/games`);
	if (unauth.status !== 401) {
		console.error("❌ unauthenticated expected 401, got", unauth.status);
		process.exit(1);
	}

	console.log("✅ unauthenticated → 401");

	const email = `verify-games-${randomUUID()}@example.local`;
	const register = await fetch(`${baseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name: "Games Verify", email, password: "password123" }),
	});
	const userCookie = parseSessionCookie(register.headers.get("set-cookie"));

	if (register.status !== 201 || !userCookie) {
		console.error("❌ register user for isolation", register.status);
		process.exit(1);
	}

	const userList = await fetch(`${baseUrl}/api/platform/games`, {
		headers: { cookie: `session=${userCookie}` },
	});

	if (userList.status !== 401) {
		console.error("❌ user session must not list platform games, got", userList.status);
		process.exit(1);
	}

	console.log("✅ user session → 401 on platform games");

	const page = await fetch(`${baseUrl}/platform/games`, { headers: platformCookie });

	if (page.status !== 200) {
		console.error("❌ GET /platform/games page expected 200, got", page.status);
		process.exit(1);
	}

	const pageHtml = await page.text();
	if (
		!pageHtml.includes("Juegos") ||
		!pageHtml.includes("Feature flag requerida") ||
		!pageHtml.includes("Crear juego")
	) {
		console.error("❌ games page missing expected copy");
		process.exit(1);
	}

	console.log("✅ GET /platform/games page OK");
	console.log("✅ verify:platform-admin-games passed");
}

void main();
