import {
	type ModerationReportPrimitives,
	type ModerationReportStatus,
	type ModerationReportTargetType,
} from "./ModerationReportTypes";

export class ModerationReport {
	private constructor(
		public readonly id: string,
		public readonly reporterUserId: string,
		public readonly targetType: ModerationReportTargetType,
		public readonly targetId: string,
		public readonly reason: string,
		public readonly status: ModerationReportStatus,
		public readonly resolvedAt: Date | null,
		public readonly resolvedByUserId: string | null,
		public readonly createdAt: Date,
	) {}

	static fromPrimitives(primitives: ModerationReportPrimitives): ModerationReport {
		return new ModerationReport(
			primitives.id,
			primitives.reporterUserId,
			primitives.targetType,
			primitives.targetId,
			primitives.reason,
			primitives.status,
			primitives.resolvedAt,
			primitives.resolvedByUserId,
			primitives.createdAt,
		);
	}

	toPrimitives(): ModerationReportPrimitives {
		return {
			id: this.id,
			reporterUserId: this.reporterUserId,
			targetType: this.targetType,
			targetId: this.targetId,
			reason: this.reason,
			status: this.status,
			resolvedAt: this.resolvedAt,
			resolvedByUserId: this.resolvedByUserId,
			createdAt: this.createdAt,
		};
	}

	resolve(resolvedByUserId: string, resolvedAt: Date): ModerationReport {
		return new ModerationReport(
			this.id,
			this.reporterUserId,
			this.targetType,
			this.targetId,
			this.reason,
			"resolved",
			resolvedAt,
			resolvedByUserId,
			this.createdAt,
		);
	}

	isOpen(): boolean {
		return this.status === "open";
	}
}
