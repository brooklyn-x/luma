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

export interface EmailProvider {
  signIn(): Promise<{ email: string }>;
  disconnect(): Promise<void>;
  listMessageIds(opts: ListOptions): Promise<string[]>;
  getMessage(id: string): Promise<EmailMessage>;
}

export async function getProvider(p: Provider): Promise<EmailProvider> {
  if (p === "google") {
    const { googleProvider } = await import("./providers/google");
    return googleProvider;
  }
  const { microsoftProvider } = await import("./providers/microsoft");
  return microsoftProvider;
}
