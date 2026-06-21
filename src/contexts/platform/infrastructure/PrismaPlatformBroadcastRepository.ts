import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import { PlatformBroadcast } from "../domain/PlatformBroadcast";
import {
	type PlatformBroadcastChannel,
	type PlatformBroadcastPrimitives,
	type PlatformBroadcastStatus,
} from "../domain/PlatformBroadcastTypes";
import {
	PlatformBroadcastRepository,
	type PlatformBroadcastListPage,
	type PlatformBroadcastListParams,
} from "../domain/PlatformBroadcastRepository";

@Service()
export class PrismaPlatformBroadcastRepository extends PlatformBroadcastRepository {
	async save(broadcast: PlatformBroadcast): Promise<void> {
		const primitives = broadcast.toPrimitives();

		await prisma.platformBroadcast.create({
			data: {
				id: primitives.id,
				channel: primitives.channel,
				audienceType: primitives.audienceType,
				tenantId: primitives.tenantId,
				subject: primitives.subject,
				body: primitives.body,
				status: primitives.status,
				recipientCount: primitives.recipientCount,
				createdByUserId: primitives.createdByUserId,
				createdAt: primitives.createdAt,
				sentAt: primitives.sentAt,
				deliveries: {
					create: broadcast.deliveries.map((delivery) => ({
						id: delivery.id,
						recipientUserId: delivery.recipientUserId,
						recipientEmail: delivery.recipientEmail,
						deliveryStatus: delivery.deliveryStatus,
					})),
				},
			},
		});
	}

	async updateStatus(broadcast: PlatformBroadcast): Promise<void> {
		const primitives = broadcast.toPrimitives();

		await prisma.platformBroadcast.update({
			where: { id: primitives.id },
			data: {
				status: primitives.status,
				sentAt: primitives.sentAt,
			},
		});
	}

	async countRecentSentByCreator(params: {
		createdByUserId: string;
		since: Date;
	}): Promise<number> {
		return prisma.platformBroadcast.count({
			where: {
				createdByUserId: params.createdByUserId,
				createdAt: { gte: params.since },
				status: { in: ["queued", "sent"] },
			},
		});
	}

	async list(params: PlatformBroadcastListParams): Promise<PlatformBroadcastListPage> {
		const [total, rows] = await Promise.all([
			prisma.platformBroadcast.count(),
			prisma.platformBroadcast.findMany({
				orderBy: { createdAt: "desc" },
				skip: params.offset,
				take: params.limit + 1,
			}),
		]);

		const hasMore = rows.length > params.limit;
		const pageRows = hasMore ? rows.slice(0, params.limit) : rows;

		return {
			broadcasts: pageRows.map((row) => this.toDomain(row)),
			total,
			hasMore,
			offset: params.offset,
			limit: params.limit,
		};
	}

	private toDomain(row: {
		id: string;
		channel: string;
		audienceType: string;
		tenantId: string | null;
		subject: string;
		body: string;
		status: string;
		recipientCount: number;
		createdByUserId: string;
		createdAt: Date;
		sentAt: Date | null;
	}): PlatformBroadcast {
		const primitives: PlatformBroadcastPrimitives = {
			id: row.id,
			channel: row.channel as PlatformBroadcastChannel,
			audienceType: row.audienceType as PlatformBroadcastPrimitives["audienceType"],
			tenantId: row.tenantId,
			subject: row.subject,
			body: row.body,
			status: row.status as PlatformBroadcastStatus,
			recipientCount: row.recipientCount,
			createdByUserId: row.createdByUserId,
			createdAt: row.createdAt,
			sentAt: row.sentAt,
		};

		return PlatformBroadcast.fromPrimitives(primitives);
	}
}
