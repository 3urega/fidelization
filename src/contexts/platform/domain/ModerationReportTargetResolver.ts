import {
	type ModerationReportTargetContext,
	type ModerationReportTargetType,
} from "./ModerationReportTypes";

export abstract class ModerationReportTargetResolver {
	abstract resolve(
		targetType: ModerationReportTargetType,
		targetId: string,
	): Promise<ModerationReportTargetContext | null>;
}
