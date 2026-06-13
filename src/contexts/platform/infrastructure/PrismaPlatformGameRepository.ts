import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import type { TenantPlanFeature } from "../../billing/subscriptions/domain/TenantPlanFeature";
import { PlatformGame } from "../domain/PlatformGame";
import {
	type ListPlatformGamesParams,
	PlatformGameRepository,
} from "../domain/PlatformGameRepository";
import {
	type PlatformGameStatus,
	parsePlatformGameStatus,
} from "../domain/PlatformGameStatus";

@Service()
export class PrismaPlatformGameRepository extends PlatformGameRepository {
	async list(params: ListPlatformGamesParams): Promise<PlatformGame[]> {
		const rows = await prisma.platformGame.findMany({
			where: params.ownerVisibleOnly
				? {
						status: { in: ["active", "beta"] },
					}
				: undefined,
			orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
		});

		return rows.map((row) => this.toDomain(row));
	}

	async searchById(id: string): Promise<PlatformGame | null> {
		const row = await prisma.platformGame.findUnique({
			where: { id },
		});

		return row ? this.toDomain(row) : null;
	}

	async searchBySlug(slug: string): Promise<PlatformGame | null> {
		const row = await prisma.platformGame.findUnique({
			where: { slug },
		});

		return row ? this.toDomain(row) : null;
	}

	async save(game: PlatformGame): Promise<void> {
		const primitives = game.toPrimitives();

		await prisma.platformGame.upsert({
			where: { id: primitives.id },
			create: {
				id: primitives.id,
				slug: primitives.slug,
				label: primitives.label,
				description: primitives.description,
				status: primitives.status,
				requiredFeature: primitives.requiredFeature,
				sortOrder: primitives.sortOrder,
			},
			update: {
				label: primitives.label,
				description: primitives.description,
				status: primitives.status,
				requiredFeature: primitives.requiredFeature,
				sortOrder: primitives.sortOrder,
			},
		});
	}

	async maxSortOrder(): Promise<number> {
		const row = await prisma.platformGame.findFirst({
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		return row?.sortOrder ?? 0;
	}

	private toDomain(row: {
		id: string;
		slug: string;
		label: string;
		description: string;
		status: string;
		requiredFeature: string;
		sortOrder: number;
	}): PlatformGame {
		return PlatformGame.fromPrimitives({
			id: row.id,
			slug: row.slug,
			label: row.label,
			description: row.description,
			status: parsePlatformGameStatus(row.status),
			requiredFeature: row.requiredFeature as TenantPlanFeature,
			sortOrder: row.sortOrder,
		});
	}
}
