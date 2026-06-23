import { merchants } from "@/data/merchants";
import type { Bill, Transaction } from "@/data/types";
import {
  getProvider,
  type EmailMessage,
  type Provider,
} from "./email-provider";
import { parseBill, parseMessage } from "./parsers";

export type SyncStage = "list" | "fetch" | "parse" | "done";

export type SyncLogEntry = {
  id: string;
  from: string;
  subject: string;
  date: string;
  status: "parsed" | "skipped" | "error" | "bill";
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
  bills: Bill[];
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
  const { daysBack = 90, maxMessages = 2500, existing } = opts;
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
  const newBills: Bill[] = [];
  const log: SyncLogEntry[] = [];
  let processed = 0;

  const concurrency = p.concurrency ?? 6;
  const batchSize = p.batchSize ?? 1;
  const useBatch = batchSize > 1 && typeof p.getMessages === "function";
  const queue = [...ids];

  type ProcessedEntry = { entry: SyncLogEntry; tx?: Transaction; bill?: Bill };

  function processFetched(
    id: string,
    msg: EmailMessage | null,
    errMsg?: string
  ): ProcessedEntry {
    if (!msg) {
      return {
        entry: {
          id,
          from: "",
          subject: "",
          date: new Date().toISOString(),
          status: "error",
          reason: errMsg ?? "unknown error",
        },
      };
    }
    const tx = parseMessage(msg);
    if (tx) {
      return {
        tx,
        entry: {
          id,
          from: msg.from.email || msg.from.name,
          subject: msg.subject,
          date: msg.date,
          status: "parsed",
          amount: tx.amount,
          merchantId: tx.merchantId,
          merchantName: tx.merchantName,
          category: tx.category,
        },
      };
    }
    const bill = parseBill(msg);
    if (bill) {
      return {
        bill,
        entry: {
          id,
          from: msg.from.email || msg.from.name,
          subject: msg.subject,
          date: msg.date,
          status: "bill",
          amount: bill.totalDue,
          merchantId: bill.issuer,
          merchantName: `${bill.issuer} statement`,
          category: "Bills",
        },
      };
    }
    return {
      entry: {
        id,
        from: msg.from.email || msg.from.name,
        subject: msg.subject,
        date: msg.date,
        status: "skipped",
        reason: "no amount or unknown sender",
      },
    };
  }

  function commit(res: ProcessedEntry) {
    if (res.tx) newTransactions.push(res.tx);
    if (res.bill) newBills.push(res.bill);
    log.push(res.entry);
    processed += 1;
    onProgress?.({
      stage: "parse",
      total,
      processed,
      parsed: newTransactions.length,
      lastEntry: res.entry,
      incremental,
    });
  }

  const yieldThread = () => new Promise<void>((r) => setTimeout(r, 0));
  const needsBody: string[] = [];

  async function runBatchWorker(localQueue: string[], withBody: boolean) {
    while (localQueue.length) {
      const chunk = localQueue.splice(0, batchSize);
      if (!chunk.length) break;
      try {
        const results = await p.getMessages!(chunk, { withBody });
        for (let i = 0; i < chunk.length; i++) {
          const id = chunk[i];
          const r = results[i];
          const entry =
            r && r.ok
              ? processFetched(id, r.message)
              : processFetched(id, null, r && !r.ok ? r.error : "no response");
          if (!withBody && entry.entry.status === "skipped") {
            // Defer to pass 2 — full body might unlock a parse.
            needsBody.push(id);
          } else {
            commit(entry);
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        for (const id of chunk) commit(processFetched(id, null, errMsg));
      }
      await yieldThread();
    }
  }

  async function singleWorker() {
    while (queue.length) {
      const id = queue.shift();
      if (!id) break;
      try {
        const msg = await p.getMessage(id);
        commit(processFetched(id, msg));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        commit(processFetched(id, null, errMsg));
      }
      await yieldThread();
    }
  }

  if (useBatch) {
    // Pass 1: preview-only fetch. Parses ~75% of receipts without ever
    // downloading the full HTML body. Skipped messages queue for pass 2.
    await Promise.all(
      Array.from({ length: Math.min(concurrency, ids.length) }, () =>
        runBatchWorker(queue, false)
      )
    );
    // Pass 2: full body for everything pass 1 couldn't parse.
    if (needsBody.length) {
      await Promise.all(
        Array.from(
          { length: Math.min(concurrency, needsBody.length) },
          () => runBatchWorker(needsBody, true)
        )
      );
    }
  } else {
    await Promise.all(
      Array.from({ length: Math.min(concurrency, ids.length) }, () =>
        singleWorker()
      )
    );
  }

  // Merge with existing if same provider
  let mergedTransactions: Transaction[];
  let mergedBills: Bill[];
  let mergedScanned: number;
  if (usable) {
    const txMap = new Map<string, Transaction>(
      usable.transactions.map((tx) => [tx.id, tx])
    );
    newTransactions.forEach((tx) => txMap.set(tx.id, tx));
    mergedTransactions = Array.from(txMap.values());
    const billMap = new Map<string, Bill>(
      (usable.bills ?? []).map((b) => [b.id, b])
    );
    newBills.forEach((b) => billMap.set(b.id, b));
    mergedBills = Array.from(billMap.values());
    mergedScanned = usable.scanned + total;
  } else {
    mergedTransactions = newTransactions;
    mergedBills = newBills;
    mergedScanned = total;
  }

  // Collapse near-duplicates (e.g. bank alert + merchant receipt for same purchase)
  mergedTransactions = dedupeNearDuplicates(mergedTransactions);

  mergedTransactions.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  mergedBills.sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
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
    bills: mergedBills,
    scanned: mergedScanned,
    fetchedAt: new Date().toISOString(),
    log,
    provider,
  };
}

// ─────────────────────────────────────────────────────────────────
// Near-duplicate detection: merchant + bank alert often emit
// separate emails for the same purchase. Collapse them into one.

const DUP_WINDOW_MS = 5 * 60 * 1000;

function displayName(tx: Transaction): string | undefined {
  const known = merchants[tx.merchantId];
  return known?.name ?? tx.merchantName;
}

function merchantOverlap(a: Transaction, b: Transaction): boolean {
  if (a.merchantId === b.merchantId && a.merchantId !== "unknown") return true;
  const aName = displayName(a)?.toLowerCase();
  const bName = displayName(b)?.toLowerCase();
  if (aName && b.gmailSnippet.toLowerCase().includes(aName)) return true;
  if (bName && a.gmailSnippet.toLowerCase().includes(bName)) return true;
  return false;
}

function rankTransaction(tx: Transaction): number {
  let score = 0;
  if (/••\d{4}/.test(tx.paymentSource)) score += 10;
  if (merchants[tx.merchantId]) score += 5;
  if (tx.kind === "card-payment") score += 3;
  const idPrefix = tx.id.slice(0, 10).toUpperCase();
  if (tx.refId && tx.refId.length >= 8 && tx.refId !== idPrefix) score += 2;
  if (tx.merchantName) score += 1;
  return score;
}

function dedupeNearDuplicates(txs: Transaction[]): Transaction[] {
  const sorted = [...txs].sort(
    (a, b) => +new Date(a.date) - +new Date(b.date)
  );
  const buckets: Transaction[][] = [];

  for (const tx of sorted) {
    const bucket = buckets.find((group) => {
      const head = group[0];
      if (head.direction !== tx.direction) return false;
      if (head.amount !== tx.amount) return false;
      const dt = Math.abs(+new Date(tx.date) - +new Date(head.date));
      if (dt > DUP_WINDOW_MS) return false;
      return merchantOverlap(head, tx);
    });
    if (bucket) bucket.push(tx);
    else buckets.push([tx]);
  }

  return buckets.map((group) => {
    if (group.length === 1) return group[0];
    const winner = group.reduce(
      (best, cur) => (rankTransaction(cur) > rankTransaction(best) ? cur : best),
      group[0]
    );
    const earliest = group.reduce(
      (best, cur) =>
        +new Date(cur.date) < +new Date(best.date) ? cur : best,
      group[0]
    );
    return { ...winner, date: earliest.date };
  });
}
