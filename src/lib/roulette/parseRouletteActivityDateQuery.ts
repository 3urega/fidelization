import { env } from "../env";
import {
	dayWindowForCalendarDate,
	endOfZonedDayUtc,
	startOfZonedDayUtc,
} from "../time/zonedCalendarWindows";

export type RouletteActivityDayWindow = {
	calendarDate: string;
	start: Date;
	end: Date;
	timezone: string;
};

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatCalendarDateInTimeZone(instant: Date, timeZone: string): string {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	return formatter.format(instant);
}

export function resolveRouletteActivityDayWindow(params: {
	dateQuery?: string | null;
	referenceDate?: Date;
	timeZone?: string;
}): RouletteActivityDayWindow | { error: string } {
	const timeZone = params.timeZone ?? env.appTimezone;
	const trimmed = params.dateQuery?.trim();

	if (trimmed) {
		if (!CALENDAR_DATE_PATTERN.test(trimmed)) {
			return { error: "date must be YYYY-MM-DD" };
		}

		try {
			const { start, end } = dayWindowForCalendarDate(trimmed, timeZone);

			return {
				calendarDate: trimmed,
				start,
				end,
				timezone: timeZone,
			};
		} catch {
			return { error: "date must be YYYY-MM-DD" };
		}
	}

	const referenceDate = params.referenceDate ?? new Date();
	const calendarDate = formatCalendarDateInTimeZone(referenceDate, timeZone);

	return {
		calendarDate,
		start: startOfZonedDayUtc(referenceDate, timeZone),
		end: endOfZonedDayUtc(referenceDate, timeZone),
		timezone: timeZone,
	};
}
