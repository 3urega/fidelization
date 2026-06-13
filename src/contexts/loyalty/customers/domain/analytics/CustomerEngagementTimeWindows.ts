import {
	endOfZonedMonthUtc,
	startOfZonedMonthUtc,
} from "../../../../../lib/time/zonedCalendarWindows";

export type CustomerEngagementMonthWindow = {
	start: Date;
	end: Date;
};

export class CustomerEngagementTimeWindows {
	static forReference(referenceDate: Date, timeZone: string): CustomerEngagementMonthWindow {
		return {
			start: startOfZonedMonthUtc(referenceDate, timeZone),
			end: endOfZonedMonthUtc(referenceDate, timeZone),
		};
	}
}
