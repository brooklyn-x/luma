/**
 * Billing-cycle month math. A "month" runs from the 15th of one calendar
 * month through the 14th of the next, and is labeled by the start month.
 */
export const CYCLE_START_DAY = 15;

export type Cycle = { year: number; month: number };

function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

export function cycleOf(date: Date | string): Cycle {
  const d = toDate(date);
  const day = d.getDate();
  const m = d.getMonth();
  const y = d.getFullYear();
  if (day >= CYCLE_START_DAY) return { year: y, month: m };
  const prev = new Date(y, m - 1, 1);
  return { year: prev.getFullYear(), month: prev.getMonth() };
}

export function cycleKey(c: Cycle): string {
  return `${c.year}-${c.month}`;
}

export function sameCycle(a: Cycle, b: Cycle): boolean {
  return a.year === b.year && a.month === b.month;
}

export function compareCycle(a: Cycle, b: Cycle): number {
  return a.year !== b.year ? a.year - b.year : a.month - b.month;
}

/** Inclusive day count from day 15 of (y,m) → day 14 of (y,m+1). */
export function daysInCycle(c: Cycle): number {
  return new Date(c.year, c.month + 1, 0).getDate();
}

/** 1-based position of `date` within cycle `c` (1 = first day of cycle). */
export function dayInCycle(date: Date | string, c: Cycle): number {
  const d = toDate(date);
  const day = d.getDate();
  if (d.getFullYear() === c.year && d.getMonth() === c.month) {
    return day - CYCLE_START_DAY + 1;
  }
  const startMonthDays = new Date(c.year, c.month + 1, 0).getDate();
  return startMonthDays - CYCLE_START_DAY + 1 + day;
}
