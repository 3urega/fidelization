import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import { ModerationReport } from "../domain/ModerationReport";
import {
	ModerationReportRepository,
	type ModerationReportListPage,
	type ModerationReportListParams,
} from "../domain/ModerationReportRepository";
import {
	type ModerationReportRow,
	type ModerationReportStatus,
	type ModerationReportTargetType,
} from "../domain/ModerationReportTypes";
import { ModerationReportTargetResolver } from "../domain/ModerationReportTargetResolver";

@Service()
export class PrismaModerationReportTargetResolver extends ModerationReportTargetResolver {
	async resolve(
		targetType: ModerationReportTargetType,
		targetId: string,
	): Promise<{ targetLabel: string; tenantId: string } | null> {
		if (targetType === "tenant") {
			const tenant = await prisma.tenant.findUnique({
				where: { id: targetId },
				select: { id: true, name: true },
			});

			if (!tenant) {
				return null;
			}

			return {
				targetLabel: tenant.name,
				tenantId: tenant.id,
			};
		}

		const promotion = await prisma.promotion.findUnique({
			where: { id: targetId },
			select: {
				id: true,
				title: true,
				tenantId: true,
			},
		});

		if (!promotion) {
			return null;
		}

		return {
			targetLabel: promotion.title,
			tenantId: promotion.tenantId,
		};
	}
}

@Service()
export class PrismaModerationReportRepository extends ModerationReportRepository {
	constructor(private readonly targetResolver: ModerationReportTargetResolver) {
		super();
	}

	async findById(id: string): Promise<ModerationReport | null> {
		const row = await prisma.moderationReport.findUnique({
			where: { id },
		});

		return row ? this.toDomain(row) : null;
	}

	async save(report: ModerationReport): Promise<void> {
		const primitives = report.toPrimitives();

		await prisma.moderationReport.update({
			where: { id: primitives.id },
			data: {
				status: primitives.status,
				resolvedAt: primitives.resolvedAt,
				resolvedByUserId: primitives.resolvedByUserId,
			},
		});
	}

	async list(params: ModerationReportListParams): Promise<ModerationReportListPage> {
		const where = params.status ? { status: params.status } : undefined;

		const [total, rows] = await Promise.all([
			prisma.moderationReport.count({ where }),
			prisma.moderationReport.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: params.offset,
				take: params.limit + 1,
				include: {
					reporter: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			}),
		]);

		const hasMore = rows.length > params.limit;
		const pageRows = hasMore ? rows.slice(0, params.limit) : rows;

		const reports = await Promise.all(
			pageRows.map(async (row) => this.toRow(row)),
		);

		return {
			reports,
			total,
			hasMore,
			offset: params.offset,
			limit: params.limit,
		};
	}

	async countOpen(): Promise<number> {
		return prisma.moderationReport.count({
			where: { status: "open" },
		});
	}

	private toDomain(row: {
		id: string;
		reporterUserId: string;
		targetType: string;
		targetId: string;
		reason: string;
		status: string;
		resolvedAt: Date | null;
		resolvedByUserId: string | null;
		createdAt: Date;
	}): ModerationReport {
		return ModerationReport.fromPrimitives({
			id: row.id,
			reporterUserId: row.reporterUserId,
			targetType: row.targetType as ModerationReportTargetType,
			targetId: row.targetId,
			reason: row.reason,
			status: row.status as ModerationReportStatus,
			resolvedAt: row.resolvedAt,
			resolvedByUserId: row.resolvedByUserId,
			createdAt: row.createdAt,
		});
	}

	private async toRow(row: {
		id: string;
		reporterUserId: string;
		targetType: string;
		targetId: string;
		reason: string;
		status: string;
		resolvedAt: Date | null;
		resolvedByUserId: string | null;
		createdAt: Date;
		reporter: {
			id: string;
			name: string;
			email: string;
		};
	}): Promise<ModerationReportRow> {
		const targetType = row.targetType as ModerationReportTargetType;
		const targetContext = await this.targetResolver.resolve(targetType, row.targetId);

		return {
			id: row.id,
			targetType,
			targetId: row.targetId,
			targetLabel: targetContext?.targetLabel ?? row.targetId,
			tenantId: targetContext?.tenantId ?? null,
			reason: row.reason,
			status: row.status as ModerationReportStatus,
			reporter: {
				userId: row.reporter.id,
				name: row.reporter.name,
				email: row.reporter.email,
			},
			createdAt: row.createdAt,
			resolvedAt: row.resolvedAt,
			resolvedByUserId: row.resolvedByUserId,
		};
	}
}
