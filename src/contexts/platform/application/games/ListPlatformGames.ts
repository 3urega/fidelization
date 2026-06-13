import { Service } from "diod";

import type { PlatformGame } from "../../domain/PlatformGame";
import {
	type ListPlatformGamesParams,
	PlatformGameRepository,
} from "../../domain/PlatformGameRepository";

@Service()
export class ListPlatformGames {
	constructor(private readonly repository: PlatformGameRepository) {}

	async execute(params: ListPlatformGamesParams = {}): Promise<PlatformGame[]> {
		return this.repository.list(params);
	}
}
