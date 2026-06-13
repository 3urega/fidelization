import { buildStampScanGlobalWindows } from "../../../../lib/time/zonedCalendarWindows";

export type TimeWindowBounds = {
	start: Date;
	end: Date;
};

export type StampScanGlobalWindows = {
	today: TimeWindowBounds;
	yesterday: TimeWindowBounds;
	last7Days: TimeWindowBounds;
};

export class StampScanTimeWindows {
	static forReference(referenceDate: Date, timeZone: string): StampScanGlobalWindows {
		return buildStampScanGlobalWindows(referenceDate, timeZone);
	}
}