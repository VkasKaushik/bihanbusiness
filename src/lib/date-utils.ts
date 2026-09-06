/**
 * Indian Standard Time (IST) Date & Time Utilities
 * Timezone: Asia/Kolkata (UTC +05:30)
 *
 * Ensures all business metrics, "today" ranges, and display timestamps
 * strictly adhere to Indian Standard Time regardless of server/browser locale.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

export interface ISTDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
}

/**
 * Extract Year, Month, Day, Hour, Minute, Second in Asia/Kolkata
 */
export function getISTDateParts(dateInput: Date | string | number = new Date()): ISTDateParts {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  const validDate = isNaN(date.getTime()) ? new Date() : date;

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(validDate);
  const map: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour ?? 0,
    minute: map.minute ?? 0,
    second: map.second ?? 0,
  };
}

/**
 * Returns UTC Date object representing 00:00:00.000 IST for the specified date (default: now)
 */
export function getStartOfISTDay(dateInput: Date | string | number = new Date()): Date {
  const { year, month, day } = getISTDateParts(dateInput);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return new Date(`${year}-${mm}-${dd}T00:00:00.000+05:30`);
}

/**
 * Returns UTC Date object representing 23:59:59.999 IST for the specified date (default: now)
 */
export function getEndOfISTDay(dateInput: Date | string | number = new Date()): Date {
  const { year, month, day } = getISTDateParts(dateInput);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return new Date(`${year}-${mm}-${dd}T23:59:59.999+05:30`);
}

/**
 * Returns UTC Date object representing 1st of month 00:00:00.000 IST
 */
export function getStartOfISTMonth(dateInput: Date | string | number = new Date()): Date {
  const { year, month } = getISTDateParts(dateInput);
  const mm = String(month).padStart(2, '0');
  return new Date(`${year}-${mm}-01T00:00:00.000+05:30`);
}

/**
 * Formats a date in standard Indian format in Asia/Kolkata: e.g. "6 Sep 2026"
 */
export function formatISTDate(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats time in Asia/Kolkata: e.g. "3:44 PM"
 */
export function formatISTTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a date & time in Asia/Kolkata: e.g. "6 Sep, 3:44 PM"
 */
export function formatISTDateTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;
  if (isNaN(date.getTime())) return '';

  const dateStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
  }).format(date);

  const timeStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${dateStr}, ${timeStr}`;
}

/**
 * Formats a date relative to today in Asia/Kolkata: "Today", "Yesterday", "5 Sep", etc.
 */
export function formatISTRelativeDate(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;
  if (isNaN(date.getTime())) return '';

  const targetParts = getISTDateParts(date);
  const nowParts = getISTDateParts(new Date());

  const targetDayTimestamp = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day);
  const todayTimestamp = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
  const diffDays = Math.round((todayTimestamp - targetDayTimestamp) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  if (targetParts.year === nowParts.year) {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  return formatISTDate(date);
}

/**
 * Dynamic human header for today in IST: e.g. "Sunday, 6 September 2026"
 */
export function getISTCurrentDateDisplay(): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

/**
 * Compact header date for top navigation in IST: e.g. "Sun, 6 Sep 2026"
 */
export function getISTHeaderDateDisplay(): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

