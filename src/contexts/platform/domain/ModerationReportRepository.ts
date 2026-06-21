import { ModerationReport } from "./ModerationReport";
import {
	type ModerationReportRow,
	type ModerationReportStatus,
} from "./ModerationReportTypes";

export type ModerationReportListParams = {
	status?: ModerationReportStatus;
	limit: number;
	offset: number;
};

export type ModerationReportListPage = {
	reports: ModerationReportRow[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
};

export abstract class ModerationReportRepository {
	abstract findById(id: string): Promise<ModerationReport | null>;

	abstract save(report: ModerationReport): Promise<void>;

	abstract list(params: ModerationReportListParams): Promise<ModerationReportListPage>;

	abstract countOpen(): Promise<number>;
}
