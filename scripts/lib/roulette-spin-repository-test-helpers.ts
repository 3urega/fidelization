import type { RouletteSpinTenantReadRow } from "../../src/contexts/loyalty/games/domain/RouletteActivityRead";
import type { ListRouletteSpinsByTenantBetweenOptions } from "../../src/contexts/loyalty/games/domain/RouletteSpinRepository";
import { RouletteSpin } from "../../src/contexts/loyalty/games/domain/RouletteSpin";

export function mapSpinsByTenantBetween(
	spins: RouletteSpin[],
	tenantId: string,
	start: Date,
	end: Date,
	options: ListRouletteSpinsByTenantBetweenOptions | undefined,
	customerNameById: Map<string, string>,
): RouletteSpinTenantReadRow[] {
	const excludeTypes = new Set(options?.prizeTypesExclude ?? []);

	return spins
		.filter((spin) => {
			const primitives = spin.toPrimitives();
			const createdAt = new Date(primitives.createdAt);

			if (primitives.tenantId !== tenantId || createdAt < start || createdAt >= end) {
				return false;
			}

			if (options?.segmentId && primitives.segmentId !== options.segmentId) {
				return false;
			}

			if (excludeTypes.size > 0 && excludeTypes.has(primitives.prizeType)) {
				return false;
			}

			return true;
		})
		.sort(
			(a, b) =>
				new Date(b.toPrimitives().createdAt).getTime() -
				new Date(a.toPrimitives().createdAt).getTime(),
		)
		.map((spin) => {
			const primitives = spin.toPrimitives();

			return {
				spinId: primitives.id,
				customerId: primitives.customerId,
				customerName: customerNameById.get(primitives.customerId) ?? "Cliente",
				segmentId: primitives.segmentId,
				segmentIndex: primitives.segmentIndex,
				prizeType: primitives.prizeType,
				status: primitives.status,
				createdAt: new Date(primitives.createdAt),
				redeemedAt: primitives.redeemedAt ? new Date(primitives.redeemedAt) : null,
				segmentLabel: spin.segmentLabel(),
			};
		});
}
