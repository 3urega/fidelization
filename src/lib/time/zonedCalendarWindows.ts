type TimeWindowBounds = {
	start: Date;
	end: Date;
};

export type StampScanGlobalWindowsBounds = {
	today: TimeWindowBounds;
	yesterday: TimeWindowBounds;
	last7Days: TimeWindowBounds;
};

type DateParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
};

function getPartsInTimeZone(instant: Date, timeZone: string): DateParts {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour12: false,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
	const parts = formatter.formatToParts(instant);
	const lookup = Object.fromEntries(
		parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
	);

	return {
		year: Number(lookup.year),
		month: Number(lookup.month),
		day: Number(lookup.day),
		hour: Number(lookup.hour === "24" ? "0" : lookup.hour),
		minute: Number(lookup.minute),
		second: Number(lookup.second),
	};
}

function zonedLocalToUtc(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number,
	timeZone: string,
): Date {
	let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);

	for (let attempt = 0; attempt < 4; attempt++) {
		const parts = getPartsInTimeZone(new Date(utcMs), timeZone);
		const asUtc = Date.UTC(
			parts.year,
			parts.month - 1,
			parts.day,
			parts.hour,
			parts.minute,
			parts.second,
		);
		const diff = Date.UTC(year, month - 1, day, hour, minute, second) - asUtc;

		if (diff === 0) {
			return new Date(utcMs);
		}

		utcMs += diff;
	}

	return new Date(utcMs);
}

function addCalendarDays(
	year: number,
	month: number,
	day: number,
	delta: number,
): { year: number; month: number; day: number } {
	const shifted = new Date(Date.UTC(year, month - 1, day + delta));

	return {
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth() + 1,
		day: shifted.getUTCDate(),
	};
}

export function startOfZonedDayUtc(referenceDate: Date, timeZone: string): Date {
	const parts = getPartsInTimeZone(referenceDate, timeZone);

	return zonedLocalToUtc(parts.year, parts.month, parts.day, 0, 0, 0, timeZone);
}

export function endOfZonedDayUtc(referenceDate: Date, timeZone: string): Date {
	const parts = getPartsInTimeZone(referenceDate, timeZone);
	const nextDay = addCalendarDays(parts.year, parts.month, parts.day, 1);

	return zonedLocalToUtc(nextDay.year, nextDay.month, nextDay.day, 0, 0, 0, timeZone);
}

export function buildStampScanGlobalWindows(
	referenceDate: Date,
	timeZone: string,
): StampScanGlobalWindowsBounds {
	const todayStart = startOfZonedDayUtc(referenceDate, timeZone);
	const todayEnd = endOfZonedDayUtc(referenceDate, timeZone);
	const refParts = getPartsInTimeZone(referenceDate, timeZone);
	const yesterdayParts = addCalendarDays(refParts.year, refParts.month, refParts.day, -1);
	const yesterdayStart = zonedLocalToUtc(
		yesterdayParts.year,
		yesterdayParts.month,
		yesterdayParts.day,
		0,
		0,
		0,
		timeZone,
	);
	const last7Parts = addCalendarDays(refParts.year, refParts.month, refParts.day, -6);
	const last7Start = zonedLocalToUtc(
		last7Parts.year,
		last7Parts.month,
		last7Parts.day,
		0,
		0,
		0,
		timeZone,
	);

	return {
		today: { start: todayStart, end: todayEnd },
		yesterday: { start: yesterdayStart, end: todayStart },
		last7Days: { start: last7Start, end: todayEnd },
	};
}
