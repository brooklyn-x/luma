export type BillStatus = "overdue" | "due-soon" | "upcoming";

/** Classify a bill by its due date relative to now. */
export function statusOf(dueDate: string): { status: BillStatus; days: number } {
  const days = Math.ceil(
    (+new Date(dueDate) - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const status: BillStatus =
    days < 0 ? "overdue" : days < 3 ? "due-soon" : "upcoming";
  return { status, days };
}

/** Human label for how soon a bill is due. */
export function dueLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}
