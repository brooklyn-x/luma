import type { Transaction } from "@/data/types";
import { getProvider, type Provider } from "./email-provider";
import { parseMessage } from "./parsers";

export type SyncStage = "list" | "fetch" | "parse" | "done";

export type SyncLogEntry = {
  id: string;
  from: string;
  subject: string;
  date: string;
  status: "parsed" | "skipped" | "error";
  amount?: number;
  merchantId?: string;
  merchantName?: string;
  category?: string;
  reason?: string;
};

export type SyncProgress = {
  stage: SyncStage;
  total: number;
  processed: number;
  parsed: number;
  lastEntry?: SyncLogEntry;
  incremental?: boolean;
};

export type SyncResult = {
  transactions: Transaction[];
  scanned: number;
  fetchedAt: string;
  log: SyncLogEntry[];
  provider: Provider;
};

export type SyncOptions = {
  existing?: SyncResult;
  daysBack?: number;
  maxMessages?: number;
};

export async function syncTransactions(
  provider: Provider,
  onProgress?: (p: SyncProgress) => void,
  opts: SyncOptions = {}
): Promise<SyncResult> {
  const { daysBack = 365, maxMessages = 1000, existing } = opts;
  // Only treat existing data as incremental if it came from the same provider.
  const usable = existing && existing.provider === provider ? existing : undefined;
  const since = usable ? new Date(usable.fetchedAt) : undefined;
  const incremental = !!since;

  const p = await getProvider(provider);
  onProgress?.({
    stage: "list",
    total: 0,
    processed: 0,
    parsed: 0,
    incremental,
  });
  const ids = await p.listMessageIds({ since, daysBack, max: maxMessages });
  const total = ids.length;
  onProgress?.({
    stage: "fetch",
    total,
    processed: 0,
    parsed: 0,
    incremental,
  });

  const newTransactions: Transaction[] = [];
  const log: SyncLogEntry[] = [];
  let processed = 0;

  const concurrency = 6;
  const queue = [...ids];

  async function worker() {
    while (queue.length) {
      const id = queue.shift();
      if (!id) break;
      let entry: SyncLogEntry;
      try {
        const msg = await p.getMessage(id);
        const tx = parseMessage(msg);
        if (tx) {
          newTransactions.push(tx);
          entry = {
            id,
            from: msg.from.email || msg.from.name,
            subject: msg.subject,
            date: msg.date,
            status: "parsed",
            amount: tx.amount,
            merchantId: tx.merchantId,
            merchantName: tx.merchantName,
            category: tx.category,
          };
        } else {
          entry = {
            id,
            from: msg.from.email || msg.from.name,
            subject: msg.subject,
            date: msg.date,
            status: "skipped",
            reason: "no amount or unknown sender",
          };
        }
      } catch (err) {
        entry = {
          id,
          from: "",
          subject: "",
          date: new Date().toISOString(),
          status: "error",
          reason: err instanceof Error ? err.message : String(err),
        };
      }
      log.push(entry);
      processed += 1;
      onProgress?.({
        stage: "parse",
        total,
        processed,
        parsed: newTransactions.length,
        lastEntry: entry,
        incremental,
      });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length) }, () => worker())
  );

  // Merge with existing if same provider
  let mergedTransactions: Transaction[];
  let mergedScanned: number;
  if (usable) {
    const map = new Map<string, Transaction>(
      usable.transactions.map((tx) => [tx.id, tx])
    );
    newTransactions.forEach((tx) => map.set(tx.id, tx));
    mergedTransactions = Array.from(map.values());
    mergedScanned = usable.scanned + total;
  } else {
    mergedTransactions = newTransactions;
    mergedScanned = total;
  }

  mergedTransactions.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  log.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  onProgress?.({
    stage: "done",
    total,
    processed,
    parsed: newTransactions.length,
    incremental,
  });

  return {
    transactions: mergedTransactions,
    scanned: mergedScanned,
    fetchedAt: new Date().toISOString(),
    log,
    provider,
  };
}
