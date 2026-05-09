import {
  loadTokens,
  revokeAndClear,
  signInWithGoogle,
} from "../google-auth";
import {
  getHeader,
  getMessage as getGmailMessage,
  getPlainBody,
  listMessageIds as listGmailIds,
} from "../gmail";
import {
  KNOWN_SENDERS,
  parseFromHeader,
} from "../email-utils";
import type {
  EmailMessage,
  EmailProvider,
  ListOptions,
} from "../email-provider";

async function signIn(): Promise<{ email: string }> {
  const tokens = await signInWithGoogle();
  return { email: tokens.email ?? "" };
}

async function disconnect(): Promise<void> {
  await revokeAndClear();
}

function buildQuery(opts: ListOptions): string {
  const fromExpr = KNOWN_SENDERS.map((s) => `from:${s}`).join(" OR ");
  const keywordExpr =
    '(subject:(receipt OR invoice OR "order confirmed" OR "payment received" OR "payment successful" OR "transaction alert" OR debited OR charged) "₹")';
  const filter = `(${fromExpr} OR ${keywordExpr})`;
  if (opts.since) {
    const unix = Math.floor(opts.since.getTime() / 1000);
    return `${filter} after:${unix}`;
  }
  return `${filter} newer_than:${opts.daysBack ?? 365}d`;
}

async function listMessageIds(opts: ListOptions): Promise<string[]> {
  const q = buildQuery(opts);
  console.log("[gm-list] mode:", opts.since ? "incremental" : "full");
  console.log("[gm-list] max:", opts.max);
  console.log("[gm-list] query:", q.length > 200 ? q.slice(0, 200) + "…" : q);
  const ids = await listGmailIds(q, opts.max);
  console.log(
    `[gm-list] DONE: ${ids.length} ids returned. cap=${opts.max} hitCap=${ids.length >= opts.max}`
  );
  return ids;
}

async function getMessage(id: string): Promise<EmailMessage> {
  const msg = await getGmailMessage(id);
  const fromRaw = getHeader(msg, "From");
  const subject = getHeader(msg, "Subject") ?? "";
  const body = getPlainBody(msg);
  const date = new Date(Number(msg.internalDate)).toISOString();
  const { email, name } = parseFromHeader(fromRaw);
  return {
    id: msg.id,
    from: { email, name },
    subject,
    body,
    date,
    snippet: msg.snippet ?? "",
  };
}

export const googleProvider: EmailProvider = {
  signIn,
  disconnect,
  listMessageIds,
  getMessage,
};

export async function isGoogleConnected(): Promise<boolean> {
  const tokens = await loadTokens();
  return !!tokens?.refreshToken;
}
