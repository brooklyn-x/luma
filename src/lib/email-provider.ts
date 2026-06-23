export type Provider = "google" | "microsoft";

export type EmailMessage = {
  id: string;
  from: { email: string; name: string };
  subject: string;
  body: string;
  date: string;
  snippet: string;
};

export type ListOptions = {
  /** ISO date — fetch only messages newer than this. */
  since?: Date;
  /** Window for full sync when `since` is absent. */
  daysBack?: number;
  /** Maximum messages to return. */
  max: number;
};

export type GetMessagesResult =
  | { ok: true; message: EmailMessage }
  | {
      ok: false;
      id: string;
      status?: number;
      error: string;
      retryable: boolean;
    };

export interface EmailProvider {
  signIn(): Promise<{ email: string }>;
  disconnect(): Promise<void>;
  listMessageIds(opts: ListOptions): Promise<string[]>;
  getMessage(id: string): Promise<EmailMessage>;
  /**
   * Batch-fetch up to `batchSize` messages in a single HTTP call. Throws on
   * whole-batch failures (network/5xx). Per-id failures are returned inline.
   * Pass `withBody: false` for a lightweight preview-only fetch.
   */
  getMessages?(
    ids: string[],
    opts?: { withBody?: boolean }
  ): Promise<GetMessagesResult[]>;
  /** Safe concurrent fetch limit for this provider. */
  concurrency?: number;
  /** Max ids per `getMessages` call. Unset/1 means no batching. */
  batchSize?: number;
}

export async function getProvider(p: Provider): Promise<EmailProvider> {
  if (p === "google") {
    const { googleProvider } = await import("./providers/google");
    return googleProvider;
  }
  const { microsoftProvider } = await import("./providers/microsoft");
  return microsoftProvider;
}
