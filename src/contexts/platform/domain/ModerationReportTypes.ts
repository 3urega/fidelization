export type ModerationReportTargetType = "tenant" | "promotion";

export type ModerationReportStatus = "open" | "resolved";

export type ModerationReportReporter = {
	userId: string;
	name: string;
	email: string;
};

export type ModerationReportRow = {
	id: string;
	targetType: ModerationReportTargetType;
	targetId: string;
	targetLabel: string;
	tenantId: string | null;
	reason: string;
	status: ModerationReportStatus;
	reporter: ModerationReportReporter;
	createdAt: Date;
	resolvedAt: Date | null;
	resolvedByUserId: string | null;
};

export type ModerationReportPrimitives = {
	id: string;
	reporterUserId: string;
	targetType: ModerationReportTargetType;
	targetId: string;
	reason: string;
	status: ModerationReportStatus;
	resolvedAt: Date | null;
	resolvedByUserId: string | null;
	createdAt: Date;
};

export type ModerationReportTargetContext = {
	targetLabel: string;
	tenantId: string;
};
