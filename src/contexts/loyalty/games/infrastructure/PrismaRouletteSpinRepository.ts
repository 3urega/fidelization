import { Service } from "diod";
import type { Prisma } from "@prisma/client";

import { prisma } from "../../../../lib/prisma";
import type { RoulettePrizeType } from "../domain/RoulettePrizeType";
import type { RouletteConfigPrimitives } from "../domain/RouletteConfig";
import {
	RouletteSpin,
	type RouletteSpinStatus,
	type RouletteSpinTriggerSource,
} from "../domain/RouletteSpin";
import type { RouletteSegmentPrize } from "../domain/RouletteSegment";
import { RouletteSpinRepository } from "../domain/RouletteSpinRepository";

@Service()
export class PrismaRouletteSpinRepository extends RouletteSpinRepository {
	async save(spin: RouletteSpin): Promise<void> {
		const p = spin.toPrimitives();

		await prisma.rouletteSpin.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				customerId: p.customerId,
				segmentId: p.segmentId,
				segmentIndex: p.segmentIndex,
				prizeType: p.prizeType,
				prizePayload: p.prizePayload as Prisma.InputJsonValue,
				status: p.status,
				triggerSource: p.triggerSource,
				triggerRef: p.triggerRef,
				idempotencyKey: p.idempotencyKey,
				configSnapshot: p.configSnapshot as Prisma.InputJsonValue,
				createdAt: new Date(p.createdAt),
				redeemedAt: p.redeemedAt ? new Date(p.redeemedAt) : null,
			},
			update: {
				status: p.status,
				redeemedAt: p.redeemedAt ? new Date(p.redeemedAt) : null,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<RouletteSpin | null> {
		const row = await prisma.rouletteSpin.findFirst({
			where: { id, tenantId },
		});

		return row ? this.mapRow(row) : null;
	}

	async countByCustomerSince(tenantId: string, customerId: string, since: Date): Promise<number> {
		return prisma.rouletteSpin.count({
			where: {
				tenantId,
				customerId,
				createdAt: { gte: since },
			},
		});
	}

	async listPendingRedeemByCustomer(tenantId: string, customerId: string): Promise<RouletteSpin[]> {
		const rows = await prisma.rouletteSpin.findMany({
			where: {
				tenantId,
				customerId,
				status: "pending_redeem",
				prizeType: "physical",
			},
			orderBy: { createdAt: "desc" },
		});

		return rows.map((row) => this.mapRow(row));
	}

	private mapRow(row: {
		id: string;
		tenantId: string;
		customerId: string;
		segmentId: string;
		segmentIndex: number;
		prizeType: string;
		prizePayload: unknown;
		status: string;
		triggerSource: string;
		triggerRef: string | null;
		idempotencyKey: string | null;
		configSnapshot: unknown;
		createdAt: Date;
		redeemedAt: Date | null;
	}): RouletteSpin {
		return RouletteSpin.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			customerId: row.customerId,
			segmentId: row.segmentId,
			segmentIndex: row.segmentIndex,
			prizeType: row.prizeType as RoulettePrizeType,
			prizePayload: row.prizePayload as RouletteSegmentPrize,
			status: row.status as RouletteSpinStatus,
			triggerSource: row.triggerSource as RouletteSpinTriggerSource,
			triggerRef: row.triggerRef,
			idempotencyKey: row.idempotencyKey,
			configSnapshot: row.configSnapshot as RouletteConfigPrimitives,
			createdAt: row.createdAt.toISOString(),
			redeemedAt: row.redeemedAt?.toISOString() ?? null,
		});
	}
}
