import { Service } from "diod";

import { InvalidPlatformGame } from "../../domain/InvalidPlatformGame";
import { PlatformGame } from "../../domain/PlatformGame";
import { parsePlatformGameCreate } from "../../domain/PlatformGameCreateInput";
import { PlatformGameRepository } from "../../domain/PlatformGameRepository";
import { PlatformGameSlugAlreadyExists } from "../../domain/PlatformGameSlugAlreadyExists";

export type CreatePlatformGameParams = {
	input: {
		slug?: string;
		label?: string;
		description?: string;
		status?: unknown;
		requiredFeature?: unknown;
		sortOrder?: number;
	};
};

@Service()
export class CreatePlatformGame {
	constructor(private readonly repository: PlatformGameRepository) {}

	async execute(params: CreatePlatformGameParams): Promise<PlatformGame> {
		const parsed = parsePlatformGameCreate(params.input);
		const existing = await this.repository.searchBySlug(parsed.slug);

		if (existing) {
			throw new PlatformGameSlugAlreadyExists(parsed.slug);
		}

		const sortOrder =
			params.input.sortOrder !== undefined
				? params.input.sortOrder
				: (await this.repository.maxSortOrder()) + 1;

		if (!Number.isInteger(sortOrder) || sortOrder < 0) {
			throw new InvalidPlatformGame("sortOrder must be a non-negative integer");
		}

		const game = PlatformGame.create({
			slug: parsed.slug,
			label: parsed.label,
			description: parsed.description,
			status: parsed.status,
			requiredFeature: parsed.requiredFeature,
			sortOrder,
		});

		await this.repository.save(game);

		return game;
	}
}
