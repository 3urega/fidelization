import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { parseRouletteConfig } from "../domain/RouletteConfig";
import { TenantGameActivation } from "../domain/TenantGameActivation";
import { TenantGameActivationRepository } from "../domain/TenantGameActivationRepository";

@Service()
export class PrismaTenantGameActivationRepository extends TenantGameActivationRepository {
	async searchByTenantAndSlug(
		tenantId: string,
		gameSlug: string,
	): Promise<TenantGameActivation | null> {
		const row = await prisma.tenantGameActivation.findUnique({
			where: {
				tenantId_gameSlug: {
					tenantId,
					gameSlug,
				},
			},
		});

		return row ? this.mapRow(row) : null;
	}

	async save(activation: TenantGameActivation): Promise<void> {
		const primitives = activation.toPrimitives();

		await prisma.tenantGameActivation.upsert({
			where: {
				tenantId_gameSlug: {
					tenantId: primitives.tenantId,
					gameSlug: primitives.gameSlug,
				},
			},
			create: {
				id: primitives.id,
				tenantId: primitives.tenantId,
				gameSlug: primitives.gameSlug,
				isEnabled: primitives.isEnabled,
				config: primitives.config,
			},
			update: {
				isEnabled: primitives.isEnabled,
				config: primitives.config,
			},
		});
	}

	private mapRow(row: {
		id: string;
		tenantId: string;
		gameSlug: string;
		isEnabled: boolean;
		config: unknown;
	}): TenantGameActivation {
		return TenantGameActivation.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			gameSlug: row.gameSlug,
			isEnabled: row.isEnabled,
			config: parseRouletteConfig(row.config).toPrimitives(),
		});
	}
}
