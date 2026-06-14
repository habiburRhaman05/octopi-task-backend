import { DateTime, IANAZone, Interval } from 'luxon';
import { TimezoneError } from './errors';
import { WorkingHours, IsoWeekday } from '../types';

export function isValidTimezone(timezone: string): boolean {
  console.log(timezone);
  
  return IANAZone.isValidZone(timezone);
}

export function assertValidTimezone(timezone: string): void {
  if (!isValidTimezone(timezone)) {
    throw new TimezoneError(`Invalid timezone: \"${timezone}\"`);
  }
}

export function convertToUTC(dateStr: string, timezone: string): Date {
  assertValidTimezone(timezone);

  const hasExplicitOffset = /([zZ]|[+-]\d{2}:?\d{2})$/.test(dateStr);
  const dt = hasExplicitOffset
    ? DateTime.fromISO(dateStr, { setZone: true })
    : DateTime.fromISO(dateStr, { zone: timezone });

  if (!dt.isValid) {
    throw new TimezoneError(
      `Invalid date string: \"${dateStr}\" (${dt.invalidReason ?? 'unknown'})`
    );
  }

  return dt.toUTC().toJSDate();
}

export function convertToOrgTimezone(utcDate: Date, timezone: string): DateTime {
  assertValidTimezone(timezone);
  console.log("t",timezone);
  
  const dt = DateTime.fromJSDate(utcDate, { zone: 'utc' }).setZone(timezone);
  if (!dt.isValid) {
    throw new TimezoneError(
      `Could not convert date to timezone \"${timezone}\" (${dt.invalidReason ?? 'unknown'})`
    );
  }
  return dt;
}

export function toOrgIsoString(utcDate: Date, timezone: string): string {
  const iso = convertToOrgTimezone(utcDate, timezone).toISO();
  if (iso === null) {
    throw new TimezoneError(`Could not serialise date in timezone \"${timezone}\"`);
  }
  return iso;
}

function parseHourMinute(value: string): { hour: number; minute: number } {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value);
  console.log("match output",match);
  
  if (!match) {
    throw new TimezoneError(`Invalid time-of-day value: \"${value}\" (expected HH:mm)`);
  }
  return { hour: Number(match[1]), minute: Number(match[2]) };
}
// working hours time format
export function getWorkingHoursWindow(
  date: Date,
  workingHours: WorkingHours,
  timezone: string
): Interval | null {
  assertValidTimezone(timezone);

  const localDay = DateTime.fromJSDate(date, { zone: 'utc' }).setZone(timezone);
  if (!localDay.isValid) {
    throw new TimezoneError(`Invalid date for working-hours window in \"${timezone}\"`);
  }

  const weekday = localDay.weekday as IsoWeekday;
  if (!workingHours.daysOfWeek.includes(weekday)) {
    return null;
  }

  const { hour: startHour, minute: startMinute } = parseHourMinute(workingHours.start);
  const { hour: endHour, minute: endMinute } = parseHourMinute(workingHours.end);

  const start = localDay.set({
    hour: startHour,
    minute: startMinute,
    second: 0,
    millisecond: 0,
  });

  let end = localDay.set({
    hour: endHour,
    minute: endMinute,
    second: 0,
    millisecond: 0,
  });

  if (end <= start) {
    end = end.plus({ days: 1 });
  }

  return Interval.fromDateTimes(start.toUTC(), end.toUTC());
}
// start day time format
export function startOfDayInZone(date: Date, timezone: string): Date {
  assertValidTimezone(timezone);
  return DateTime.fromJSDate(date, { zone: 'utc' })
    .setZone(timezone)
    .startOf('day')
    .toUTC()
    .toJSDate();
}
// end day time 
export function endOfDayInZone(date: Date, timezone: string): Date {
  assertValidTimezone(timezone);
  return DateTime.fromJSDate(date, { zone: 'utc' })
    .setZone(timezone)
    .endOf('day')
    .toUTC()
    .toJSDate();
}
