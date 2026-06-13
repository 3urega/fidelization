import { Service } from "diod";

import { PlatformGame } from "../../domain/PlatformGame";
import { PlatformGameNotFound } from "../../domain/PlatformGameNotFound";
import { parsePlatformGamePartialUpdate } from "../../domain/PlatformGameUpdateInput";
import { PlatformGameRepository } from "../../domain/PlatformGameRepository";

export type UpdatePlatformGameParams = {
	gameId: string;
	input: {
		label?: string;
		description?: string;
		status?: unknown;
		requiredFeature?: unknown;
		sortOrder?: number;
	};
};

@Service()
export class UpdatePlatformGame {
	constructor(private readonly repository: PlatformGameRepository) {}

	async execute(params: UpdatePlatformGameParams): Promise<PlatformGame> {
		const existing = await this.repository.searchById(params.gameId);

		if (!existing) {
			throw new PlatformGameNotFound(params.gameId);
		}

		const patch = parsePlatformGamePartialUpdate(params.input);
		const current = existing.toPrimitives();

		const updated = existing.update({
			label: patch.label ?? current.label,
			description: patch.description ?? current.description,
			status: patch.status ?? current.status,
			requiredFeature: patch.requiredFeature ?? current.requiredFeature,
			sortOrder: patch.sortOrder ?? current.sortOrder,
		});

		await this.repository.save(updated);

		return updated;
	}
}
