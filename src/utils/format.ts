import { differenceInCalendarDays, format, isThisWeek, isToday, isYesterday } from "date-fns";

export function formatCurrency(value: number, currency = "INR") {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

export function formatRelativeDay(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "Earlier this week";
  return format(d, "MMM d");
}

export function formatTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "h:mm a");
}

export function formatLongDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEE, MMM d • h:mm a");
}

export function daysUntil(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return differenceInCalendarDays(d, new Date());
}
