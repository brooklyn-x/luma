import { getValidAccessToken } from "./google-auth";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GmailHeader = { name: string; value: string };

export type GmailPart = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { size?: number; data?: string };
  parts?: GmailPart[];
};

export type GmailMessage = {
  id: string;
  threadId: string;
  internalDate: string;
  snippet: string;
  payload: GmailPart;
  labelIds?: string[];
};

async function gmailFetch<T>(path: string): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function listMessageIds(
  query: string,
  maxResults = 100
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(Math.min(100, maxResults - ids.length)),
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await gmailFetch<{
      messages?: { id: string }[];
      nextPageToken?: string;
    }>(`/messages?${params.toString()}`);
    if (data.messages) ids.push(...data.messages.map((m) => m.id));
    pageToken = data.nextPageToken;
  } while (pageToken && ids.length < maxResults);
  return ids.slice(0, maxResults);
}

export function getMessage(id: string): Promise<GmailMessage> {
  return gmailFetch<GmailMessage>(`/messages/${id}?format=full`);
}

export function getHeader(msg: GmailMessage, name: string): string | undefined {
  const lower = name.toLowerCase();
  return msg.payload.headers?.find((h) => h.name.toLowerCase() === lower)?.value;
}

function base64UrlDecode(input: string): string {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof globalThis.atob === "function") {
    const binary = globalThis.atob(normalized);
    let out = "";
    for (let i = 0; i < binary.length; i++) {
      out += String.fromCharCode(binary.charCodeAt(i));
    }
    return decodeURIComponent(escape(out));
  }
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function collectParts(part: GmailPart, into: GmailPart[]): void {
  if (!part) return;
  if (part.body?.data) into.push(part);
  part.parts?.forEach((p) => collectParts(p, into));
}

export function getMessageBody(msg: GmailMessage): {
  text: string;
  html: string;
} {
  const parts: GmailPart[] = [];
  collectParts(msg.payload, parts);
  let text = "";
  let html = "";
  for (const p of parts) {
    if (!p.body?.data) continue;
    const decoded = base64UrlDecode(p.body.data);
    if (p.mimeType === "text/plain" && !text) text = decoded;
    else if (p.mimeType === "text/html" && !html) html = decoded;
  }
  return { text, html };
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x?[0-9a-f]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPlainBody(msg: GmailMessage): string {
  const { text, html } = getMessageBody(msg);
  if (text) return text.replace(/\s+/g, " ").trim();
  if (html) return stripHtml(html);
  return msg.snippet ?? "";
}
