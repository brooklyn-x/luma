import { useMemo } from "react";
import { merchants } from "@/data/merchants";
import { useTheme } from "@/theme";
import { dueLabel, statusOf } from "@/utils/bills";
import { daysUntil } from "@/utils/format";
import {
  selectActiveBills,
  selectTransactions,
  useTransactions,
} from "@/hooks/use-transactions";

export type NotificationKind = "bill" | "renewal" | "spend";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  amount?: number;
  date: string;
  tint: string;
  unread: boolean;
  merchantId?: string;
  txId?: string;
};

const SPEND_THRESHOLD = 2000;
const MAX_ITEMS = 15;

export function useNotifications(): {
  items: AppNotification[];
  unreadCount: number;
} {
  const t = useTheme();
  const { data } = useTransactions();

  return useMemo(() => {
    const transactions = selectTransactions(data);
    const bills = selectActiveBills(data);
    const items: AppNotification[] = [];

    // Bills due / overdue
    bills.forEach((bill) => {
      const { status, days } = statusOf(bill.dueDate);
      items.push({
        id: `bill-${bill.id}`,
        kind: "bill",
        title: `${bill.issuer} bill`,
        body: dueLabel(days),
        amount: bill.totalDue,
        date: bill.dueDate,
        tint: status === "overdue" ? t.red : status === "due-soon" ? t.yellow : t.muted,
        unread: status !== "upcoming",
      });
    });

    const nameOf = (merchantId: string, fallback?: string) =>
      merchants[merchantId]?.name ?? fallback ?? merchantId;

    // Recurring renewals (most recent 5)
    transactions
      .filter((tx) => tx.recurring && tx.direction === "debit")
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 5)
      .forEach((tx) => {
        items.push({
          id: `renewal-${tx.id}`,
          kind: "renewal",
          title: `${nameOf(tx.merchantId, tx.merchantName)} renewed`,
          body: tx.category,
          amount: tx.amount,
          date: tx.date,
          tint: t.purple,
          unread: -daysUntil(tx.date) <= 3,
          merchantId: tx.merchantId,
          txId: tx.id,
        });
      });

    // Large recent purchases (last 7 days, >= threshold, max 3)
    transactions
      .filter(
        (tx) =>
          tx.direction === "debit" &&
          tx.kind === "purchase" &&
          !tx.recurring &&
          tx.amount >= SPEND_THRESHOLD &&
          -daysUntil(tx.date) <= 7
      )
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 3)
      .forEach((tx) => {
        items.push({
          id: `spend-${tx.id}`,
          kind: "spend",
          title: nameOf(tx.merchantId, tx.merchantName),
          body: `Large purchase · ${tx.category}`,
          amount: tx.amount,
          date: tx.date,
          tint: t.blue,
          unread: -daysUntil(tx.date) <= 2,
          merchantId: tx.merchantId,
          txId: tx.id,
        });
      });

    items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    const capped = items.slice(0, MAX_ITEMS);
    return {
      items: capped,
      unreadCount: capped.filter((n) => n.unread).length,
    };
  }, [data, t]);
}
