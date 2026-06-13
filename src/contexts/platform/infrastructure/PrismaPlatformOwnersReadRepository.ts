import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import {
	type PlatformOwnerBusiness,
	type PlatformOwnerSummary,
	type PlatformOwnersListParams,
	type PlatformOwnersPage,
} from "../domain/PlatformOwnerSummary";
import { PlatformOwnersReadRepository } from "../domain/PlatformOwnersReadRepository";

@Service()
export class PrismaPlatformOwnersReadRepository extends PlatformOwnersReadRepository {
	async list(params: PlatformOwnersListParams): Promise<PlatformOwnersPage> {
		const search = params.search?.trim();

		const where = {
			memberships: {
				some: {
					role: "owner" as const,
				},
			},
			...(search
				? {
						OR: [
							{ name: { contains: search, mode: "insensitive" as const } },
							{ email: { contains: search, mode: "insensitive" as const } },
						],
					}
				: {}),
		};

		const [total, rows] = await Promise.all([
			prisma.user.count({ where }),
			prisma.user.findMany({
				where,
				orderBy: { name: "asc" },
				skip: params.offset,
				take: params.limit + 1,
				include: {
					memberships: {
						where: { role: "owner" },
						include: {
							tenant: {
								select: {
									id: true,
									slug: true,
									name: true,
									subscriptionPlan: true,
									status: true,
								},
							},
						},
						orderBy: { tenant: { name: "asc" } },
					},
				},
			}),
		]);

		const hasMore = rows.length > params.limit;
		const pageRows = hasMore ? rows.slice(0, params.limit) : rows;

		const owners: PlatformOwnerSummary[] = pageRows.map((row) => ({
			userId: row.id,
			name: row.name,
			email: row.email,
			businesses: row.memberships.map(
				(membership): PlatformOwnerBusiness => ({
					tenantId: membership.tenant.id,
					slug: membership.tenant.slug,
					name: membership.tenant.name,
					subscriptionPlan: membership.tenant.subscriptionPlan,
					status: membership.tenant.status,
				}),
			),
		}));

		return {
			owners,
			total,
			hasMore,
			offset: params.offset,
			limit: params.limit,
		};
	}
}
