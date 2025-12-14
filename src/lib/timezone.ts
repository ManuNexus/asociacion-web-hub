import { format as formatDate, parse } from "date-fns";
import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";
import { es } from "date-fns/locale";

export const MADRID_TIMEZONE = "Europe/Madrid";

/**
 * Converts a UTC date to Madrid timezone for display
 */
export function toMadridTime(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return toZonedTime(d, MADRID_TIMEZONE);
}

/**
 * Converts a local Madrid time to UTC for storage
 * Use this when the user enters a datetime-local value
 */
export function fromMadridTime(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return fromZonedTime(d, MADRID_TIMEZONE);
}

/**
 * Formats a date in Madrid timezone
 */
export function formatInMadrid(
  date: Date | string,
  formatStr: string = "dd/MM/yyyy HH:mm"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatTz(d, formatStr, { timeZone: MADRID_TIMEZONE, locale: es });
}

/**
 * Formats a date for datetime-local input (in Madrid timezone)
 */
export function toDateTimeLocalValue(date: Date | string): string {
  const madridDate = toMadridTime(date);
  return formatDate(madridDate, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Converts a datetime-local input value to ISO string (UTC)
 * The input is assumed to be in Madrid timezone
 */
export function fromDateTimeLocalValue(localValue: string): string {
  // Parse the local value as if it's in Madrid timezone
  const localDate = new Date(localValue);
  const utcDate = fromMadridTime(localDate);
  return utcDate.toISOString();
}
