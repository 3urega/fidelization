import type { ModerationReport } from "../../contexts/platform/domain/ModerationReport";
import type { ModerationReportListPage } from "../../contexts/platform/domain/ModerationReportRepository";
import type { ModerationReportRow } from "../../contexts/platform/domain/ModerationReportTypes";
import type { CountOpenModerationReportsResult } from "../../contexts/platform/application/moderation/CountOpenModerationReports";

export type ModerationReportReporterResponse = {
	userId: string;
	name: string;
	email: string;
};

export type ModerationReportResponse = {
	id: string;
	targetType: string;
	targetId: string;
	targetLabel: string;
	tenantId: string | null;
	reason: string;
	status: string;
	reporter: ModerationReportReporterResponse;
	createdAt: string;
	resolvedAt: string | null;
	resolvedByUserId: string | null;
};

export type ModerationSummaryResponse = {
	openCount: number;
};

export function moderationReportToJson(report: ModerationReportRow): ModerationReportResponse {
	return {
		id: report.id,
		targetType: report.targetType,
		targetId: report.targetId,
		targetLabel: report.targetLabel,
		tenantId: report.tenantId,
		reason: report.reason,
		status: report.status,
		reporter: report.reporter,
		createdAt: report.createdAt.toISOString(),
		resolvedAt: report.resolvedAt?.toISOString() ?? null,
		resolvedByUserId: report.resolvedByUserId,
	};
}

export function moderationReportsPageToJson(page: ModerationReportListPage): {
	reports: ModerationReportResponse[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
} {
	return {
		reports: page.reports.map(moderationReportToJson),
		total: page.total,
		hasMore: page.hasMore,
		offset: page.offset,
		limit: page.limit,
	};
}

export function moderationSummaryToJson(
	summary: CountOpenModerationReportsResult,
): ModerationSummaryResponse {
	return {
		openCount: summary.openCount,
	};
}

export function moderationReportEntityToJson(report: ModerationReport): {
	id: string;
	status: string;
	resolvedAt: string | null;
	resolvedByUserId: string | null;
} {
	const primitives = report.toPrimitives();

	return {
		id: primitives.id,
		status: primitives.status,
		resolvedAt: primitives.resolvedAt?.toISOString() ?? null,
		resolvedByUserId: primitives.resolvedByUserId,
	};
}
