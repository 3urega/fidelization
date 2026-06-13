/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { CreatePlatformGame } from "../src/contexts/platform/application/games/CreatePlatformGame";
import { ListPlatformGames } from "../src/contexts/platform/application/games/ListPlatformGames";
import { UpdatePlatformGame } from "../src/contexts/platform/application/games/UpdatePlatformGame";
import { InvalidPlatformGame } from "../src/contexts/platform/domain/InvalidPlatformGame";
import { PlatformGame } from "../src/contexts/platform/domain/PlatformGame";
import { PlatformGameNotFound } from "../src/contexts/platform/domain/PlatformGameNotFound";
import {
	type ListPlatformGamesParams,
	PlatformGameRepository,
} from "../src/contexts/platform/domain/PlatformGameRepository";
import { PlatformGameSlugAlreadyExists } from "../src/contexts/platform/domain/PlatformGameSlugAlreadyExists";

const activeRuleta = PlatformGame.fromPrimitives({
	id: "game-ruleta",
	slug: "ruleta",
	label: "Ruleta",
	description: "Gira la ruleta",
	status: "active",
	requiredFeature: "gamification",
	sortOrder: 1,
});

const draftCaja = PlatformGame.fromPrimitives({
	id: "game-caja",
	slug: "caja-misteriosa",
	label: "Caja misteriosa",
	description: "Borrador",
	status: "draft",
	requiredFeature: "gamification",
	sortOrder: 2,
});

class InMemoryPlatformGameRepository extends PlatformGameRepository {
	constructor(private games: PlatformGame[]) {
		super();
	}

	async list(params: ListPlatformGamesParams): Promise<PlatformGame[]> {
		let rows = [...this.games];

		if (params.ownerVisibleOnly) {
			rows = rows.filter((game) => {
				const status = game.toPrimitives().status;
				return status === "active" || status === "beta";
			});
		}

		return rows.sort((left, right) => {
			const leftOrder = left.toPrimitives().sortOrder;
			const rightOrder = right.toPrimitives().sortOrder;

			if (leftOrder !== rightOrder) {
				return leftOrder - rightOrder;
			}

			return left.toPrimitives().label.localeCompare(right.toPrimitives().label);
		});
	}

	async searchById(id: string): Promise<PlatformGame | null> {
		return this.games.find((game) => game.toPrimitives().id === id) ?? null;
	}

	async searchBySlug(slug: string): Promise<PlatformGame | null> {
		return this.games.find((game) => game.toPrimitives().slug === slug) ?? null;
	}

	async save(game: PlatformGame): Promise<void> {
		const primitives = game.toPrimitives();
		const index = this.games.findIndex((row) => row.toPrimitives().id === primitives.id);

		if (index >= 0) {
			this.games[index] = game;

			return;
		}

		this.games.push(game);
	}

	async maxSortOrder(): Promise<number> {
		if (this.games.length === 0) {
			return 0;
		}

		return Math.max(...this.games.map((game) => game.toPrimitives().sortOrder));
	}
}

async function main(): Promise<void> {
	const repository = new InMemoryPlatformGameRepository([activeRuleta, draftCaja]);
	const listUseCase = new ListPlatformGames(repository);
	const createUseCase = new CreatePlatformGame(repository);
	const updateUseCase = new UpdatePlatformGame(repository);

	const all = await listUseCase.execute();

	if (all.length !== 2) {
		console.error("❌ list all games", all.length);
		process.exit(1);
	}

	const ownerVisible = await listUseCase.execute({ ownerVisibleOnly: true });

	if (ownerVisible.length !== 1 || ownerVisible[0]?.toPrimitives().id !== activeRuleta.toPrimitives().id) {
		console.error("❌ ownerVisibleOnly excludes draft", ownerVisible);
		process.exit(1);
	}

	console.log("✅ ListPlatformGames all vs ownerVisibleOnly");

	const created = await createUseCase.execute({
		input: {
			slug: "rasca",
			label: "Rasca y gana",
			description: "Beta game",
			status: "beta",
		},
	});

	if (
		created.toPrimitives().slug !== "rasca" ||
		created.toPrimitives().sortOrder !== 3 ||
		created.toPrimitives().status !== "beta"
	) {
		console.error("❌ CreatePlatformGame", created.toPrimitives());
		process.exit(1);
	}

	console.log("✅ CreatePlatformGame");

	const deactivated = await updateUseCase.execute({
		gameId: created.toPrimitives().id,
		input: { status: "draft" },
	});

	if (deactivated.toPrimitives().status !== "draft") {
		console.error("❌ UpdatePlatformGame deactivate", deactivated.toPrimitives());
		process.exit(1);
	}

	const ownerAfterDeactivate = await listUseCase.execute({ ownerVisibleOnly: true });

	if (ownerAfterDeactivate.length !== 1) {
		console.error("❌ draft game hidden from ownerVisibleOnly", ownerAfterDeactivate);
		process.exit(1);
	}

	console.log("✅ UpdatePlatformGame deactivate to draft");

	try {
		await createUseCase.execute({
			input: { slug: "ruleta", label: "Duplicate" },
		});
		console.error("❌ expected PlatformGameSlugAlreadyExists");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlatformGameSlugAlreadyExists)) {
			console.error("❌ unexpected slug conflict error", error);
			process.exit(1);
		}
	}

	try {
		await updateUseCase.execute({
			gameId: "missing-game",
			input: { label: "Nope" },
		});
		console.error("❌ expected PlatformGameNotFound");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlatformGameNotFound)) {
			console.error("❌ unexpected not-found error", error);
			process.exit(1);
		}
	}

	try {
		await createUseCase.execute({ input: { slug: "bad slug", label: "Bad" } });
		console.error("❌ expected InvalidPlatformGame for bad slug");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidPlatformGame)) {
			console.error("❌ unexpected validation error", error);
			process.exit(1);
		}
	}

	console.log("✅ validation + not found + slug conflict errors");
	console.log("✅ verify:platform-admin-games-use-case passed");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
