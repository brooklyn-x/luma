import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { env } from "../env";
import { parseFromHeader, stripHtml } from "../email-utils";
import type {
  EmailMessage,
  EmailProvider,
  GetMessagesResult,
  ListOptions,
} from "../email-provider";

WebBrowser.maybeCompleteAuthSession();

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint:
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenEndpoint:
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
};

const SCOPES = [
  "openid",
  "email",
  "profile",
  "offline_access",
  "User.Read",
  "Mail.Read",
];

const ACCESS_KEY = "luma_ms_access_token";
const REFRESH_KEY = "luma_ms_refresh_token";
const ID_KEY = "luma_ms_id_token";
const META_KEY = "luma_ms_meta";
const LEGACY_KEY = "luma_microsoft_tokens";

const GRAPH = "https://graph.microsoft.com/v1.0";

type MsTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  idToken?: string;
  email?: string;
};

function decodeIdTokenEmail(idToken?: string): string | undefined {
  if (!idToken) return undefined;
  try {
    const payload = idToken.split(".")[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = globalThis.atob
      ? globalThis.atob(normalized)
      : Buffer.from(normalized, "base64").toString("binary");
    const json = JSON.parse(decoded) as {
      email?: string;
      preferred_username?: string;
    };
    return json.email ?? json.preferred_username;
  } catch {
    return undefined;
  }
}

async function loadTokens(): Promise<MsTokens | null> {
  const [access, refresh, id, metaRaw] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
    SecureStore.getItemAsync(ID_KEY),
    SecureStore.getItemAsync(META_KEY),
  ]);

  if (access && refresh && metaRaw) {
    try {
      const meta = JSON.parse(metaRaw) as { expiresAt: number; email?: string };
      return {
        accessToken: access,
        refreshToken: refresh,
        idToken: id ?? undefined,
        expiresAt: meta.expiresAt,
        email: meta.email,
      };
    } catch {
      return null;
    }
  }

  // Legacy fallback — single-blob format from earlier builds.
  const legacy = await SecureStore.getItemAsync(LEGACY_KEY);
  if (!legacy) return null;
  try {
    const parsed = JSON.parse(legacy) as MsTokens;
    await saveTokens(parsed);
    await SecureStore.deleteItemAsync(LEGACY_KEY);
    return parsed;
  } catch {
    return null;
  }
}

async function saveTokens(tokens: MsTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
    tokens.idToken
      ? SecureStore.setItemAsync(ID_KEY, tokens.idToken)
      : SecureStore.deleteItemAsync(ID_KEY),
    SecureStore.setItemAsync(
      META_KEY,
      JSON.stringify({ expiresAt: tokens.expiresAt, email: tokens.email })
    ),
  ]);
}

async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    SecureStore.deleteItemAsync(ID_KEY),
    SecureStore.deleteItemAsync(META_KEY),
    SecureStore.deleteItemAsync(LEGACY_KEY),
  ]);
}

function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: "luma",
    path: "oauthredirect",
  });
}

async function refreshAccessToken(refreshToken: string): Promise<MsTokens> {
  const clientId = env.microsoftClientId;
  const tokenResponse = await AuthSession.refreshAsync(
    { clientId, refreshToken, scopes: SCOPES },
    discovery
  );
  const existing = await loadTokens();
  const tokens: MsTokens = {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken ?? refreshToken,
    expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
    idToken: tokenResponse.idToken ?? existing?.idToken,
    email: decodeIdTokenEmail(tokenResponse.idToken) ?? existing?.email,
  };
  await saveTokens(tokens);
  return tokens;
}

async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error("Not signed in to Microsoft");
  const skewMs = 60_000;
  if (Date.now() < tokens.expiresAt - skewMs) {
    return tokens.accessToken;
  }
  const refreshed = await refreshAccessToken(tokens.refreshToken);
  return refreshed.accessToken;
}

async function signIn(): Promise<{ email: string }> {
  const clientId = env.microsoftClientId;
  if (!clientId) {
    throw new Error(
      "Microsoft client ID missing. Set EXPO_PUBLIC_MICROSOFT_CLIENT_ID in .env."
    );
  }
  const redirectUri = getRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: SCOPES,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: { prompt: "select_account" },
  });

  const authUrl = await request.makeAuthUrlAsync(discovery);
  console.log("[microsoft-auth] redirectUri:", redirectUri);
  console.log("[microsoft-auth] authUrl:", authUrl);
  const result = await request.promptAsync(discovery);
  console.log("[microsoft-auth] result:", JSON.stringify(result, null, 2));

  if (result.type !== "success") {
    if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error("Sign-in cancelled");
    }
    if (result.type === "error") {
      const params = (result as { params?: Record<string, string> }).params;
      const reason = params?.error_description ?? params?.error ?? result.type;
      throw new Error(`Microsoft error: ${reason}`);
    }
    throw new Error(`Sign-in failed: ${result.type}`);
  }

  const code = result.params.code;
  if (!code) throw new Error("No authorization code returned");

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      scopes: SCOPES,
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : undefined,
    },
    discovery
  );

  if (!tokenResponse.refreshToken) {
    throw new Error(
      "No refresh token returned. Ensure the Azure app has 'offline_access' scope and 'Allow public client flows' is enabled."
    );
  }

  const tokens: MsTokens = {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
    idToken: tokenResponse.idToken,
    email: decodeIdTokenEmail(tokenResponse.idToken),
  };
  await saveTokens(tokens);

  return { email: tokens.email ?? "" };
}

async function disconnect(): Promise<void> {
  await clearTokens();
}

const MAX_RETRIES = 4;
const MAX_RETRY_AFTER_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(header: string | null, attempt: number): number {
  const fallback = Math.min(MAX_RETRY_AFTER_MS, 500 * 2 ** attempt);
  if (!header) return fallback;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(MAX_RETRY_AFTER_MS, seconds * 1000);
  }
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    return Math.min(MAX_RETRY_AFTER_MS, Math.max(0, dateMs - Date.now()));
  }
  return fallback;
}

async function graphFetch<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const token = await getValidAccessToken();
    const res = await fetch(`${GRAPH}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return (await res.json()) as T;

    const retryable = res.status === 429 || res.status === 503;
    if (retryable && attempt < MAX_RETRIES) {
      const wait = parseRetryAfter(res.headers.get("Retry-After"), attempt);
      console.log(
        `[ms-graph] ${res.status} on ${path.slice(0, 80)} — retry ${attempt + 1}/${MAX_RETRIES} in ${wait}ms`
      );
      await sleep(wait);
      continue;
    }

    const body = await res.text();
    throw new Error(`Graph ${res.status}: ${body.slice(0, 200)}`);
  }
}

async function graphPost<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const token = await getValidAccessToken();
    const res = await fetch(`${GRAPH}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return (await res.json()) as T;

    const retryable = res.status === 429 || res.status === 503;
    if (retryable && attempt < MAX_RETRIES) {
      const wait = parseRetryAfter(res.headers.get("Retry-After"), attempt);
      console.log(
        `[ms-graph] POST ${res.status} on ${path.slice(0, 80)} — retry ${attempt + 1}/${MAX_RETRIES} in ${wait}ms`
      );
      await sleep(wait);
      continue;
    }

    const text = await res.text();
    throw new Error(`Graph ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function listMessageIds(opts: ListOptions): Promise<string[]> {
  const ids: string[] = [];
  let initialPath: string;

  const cutoff = opts.since
    ? opts.since
    : new Date(Date.now() - (opts.daysBack ?? 365) * 86_400_000);
  const iso = cutoff.toISOString();
  initialPath =
    `/me/messages` +
    `?$filter=${encodeURIComponent(`receivedDateTime ge ${iso}`)}` +
    `&$orderby=${encodeURIComponent("receivedDateTime desc")}` +
    `&$top=${Math.min(50, opts.max)}` +
    `&$select=id,receivedDateTime`;

  console.log("[ms-list] mode:", opts.since ? "incremental" : "full");
  console.log("[ms-list] cutoff:", iso);
  console.log("[ms-list] max:", opts.max);
  console.log("[ms-list] initialPath:", initialPath);

  let path: string | null = initialPath;
  let pageNum = 0;
  let oldestSeen: string | null = null;
  let newestSeen: string | null = null;
  while (path && ids.length < opts.max) {
    pageNum++;
    const data: {
      value?: { id: string; receivedDateTime?: string }[];
      "@odata.nextLink"?: string;
    } = await graphFetch(path);
    const got = data.value ?? [];
    if (got.length) {
      ids.push(...got.map((m) => m.id));
      const dates = got.map((m) => m.receivedDateTime).filter(Boolean) as string[];
      if (dates.length) {
        if (!newestSeen) newestSeen = dates[0];
        oldestSeen = dates[dates.length - 1];
      }
    }
    const next = data["@odata.nextLink"];
    console.log(
      `[ms-list] page ${pageNum}: +${got.length} ids (total ${ids.length})  oldestThisPage=${
        got[got.length - 1]?.receivedDateTime ?? "?"
      }  hasNext=${!!next}`
    );
    if (next) {
      const url = new URL(next);
      path = `${url.pathname.replace(/^\/v1\.0/, "")}${url.search}`;
    } else {
      path = null;
    }
  }
  console.log(
    `[ms-list] DONE: ${ids.length} ids across ${pageNum} pages. newest=${newestSeen} oldest=${oldestSeen} cap=${opts.max} hitCap=${ids.length >= opts.max}`
  );
  return ids.slice(0, opts.max);
}

type GraphMessage = {
  id: string;
  subject?: string;
  receivedDateTime?: string;
  bodyPreview?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  body?: { contentType?: "html" | "text"; content?: string };
};

const MESSAGE_SELECT_PREVIEW = "id,subject,from,receivedDateTime,bodyPreview";
const MESSAGE_SELECT_FULL = `${MESSAGE_SELECT_PREVIEW},body`;
const BATCH_LIMIT = 20;

function shapeGraphMessage(msg: GraphMessage): EmailMessage {
  const fromAddress = msg.from?.emailAddress?.address ?? "";
  const fromName = msg.from?.emailAddress?.name ?? "";
  const rawBody = msg.body?.content;
  const preview = msg.bodyPreview ?? "";
  let body: string;
  if (rawBody) {
    body =
      msg.body?.contentType === "text"
        ? rawBody.replace(/\s+/g, " ").trim()
        : stripHtml(rawBody);
  } else {
    // Preview-only fetch: surface the 255-char preview as `body` so parsers
    // (which read msg.body) can attempt a match against it.
    body = preview;
  }
  return {
    id: msg.id,
    from: parseFromHeader(`"${fromName}" <${fromAddress}>`),
    subject: msg.subject ?? "",
    body,
    date: msg.receivedDateTime
      ? new Date(msg.receivedDateTime).toISOString()
      : new Date().toISOString(),
    snippet: preview,
  };
}

async function getMessage(id: string): Promise<EmailMessage> {
  const msg = await graphFetch<GraphMessage>(
    `/me/messages/${id}?$select=${MESSAGE_SELECT_FULL}`
  );
  return shapeGraphMessage(msg);
}

type BatchSubResponse = {
  id: string;
  status: number;
  headers?: Record<string, string>;
  body?: GraphMessage | { error?: { code?: string; message?: string } };
};

type BatchResponse = { responses: BatchSubResponse[] };

function headerValue(
  headers: Record<string, string> | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return null;
}

async function getMessages(
  ids: string[],
  opts?: { withBody?: boolean }
): Promise<GetMessagesResult[]> {
  if (ids.length === 0) return [];
  if (ids.length > BATCH_LIMIT) {
    throw new Error(`getMessages: max ${BATCH_LIMIT} ids per call`);
  }

  const withBody = opts?.withBody ?? true;
  const select = withBody ? MESSAGE_SELECT_FULL : MESSAGE_SELECT_PREVIEW;
  const passLabel = withBody ? "body" : "preview";

  const results = new Map<string, GetMessagesResult>();
  let pending = [...ids];

  for (let attempt = 0; attempt <= MAX_RETRIES && pending.length; attempt++) {
    const requests = pending.map((id) => ({
      id,
      method: "GET",
      url: `/me/messages/${id}?$select=${select}`,
    }));
    console.log(
      `[ms-batch] POST $batch  pass=${passLabel}  ids=${pending.length}  attempt=${attempt + 1}`
    );
    const data = await graphPost<BatchResponse>("/$batch", { requests });

    const throttled: string[] = [];
    let waitMs = 0;

    for (const r of data.responses) {
      if (r.status === 200 && r.body && "id" in r.body) {
        results.set(r.id, {
          ok: true,
          message: shapeGraphMessage(r.body as GraphMessage),
        });
        continue;
      }
      const isThrottle = r.status === 429 || r.status === 503;
      if (isThrottle && attempt < MAX_RETRIES) {
        throttled.push(r.id);
        const ra = parseRetryAfter(headerValue(r.headers, "Retry-After"), attempt);
        if (ra > waitMs) waitMs = ra;
        continue;
      }
      const errBody = r.body as
        | { error?: { code?: string; message?: string } }
        | undefined;
      const errMsg = errBody?.error?.message ?? `status ${r.status}`;
      results.set(r.id, {
        ok: false,
        id: r.id,
        status: r.status,
        error: errMsg,
        retryable: isThrottle,
      });
    }

    if (!throttled.length) break;
    console.log(
      `[ms-batch] throttled=${throttled.length}/${pending.length}  sleeping ${waitMs}ms`
    );
    await sleep(waitMs);
    pending = throttled;
  }

  return ids.map(
    (id) =>
      results.get(id) ?? {
        ok: false,
        id,
        error: "no response in batch",
        retryable: false,
      }
  );
}

export const microsoftProvider: EmailProvider = {
  signIn,
  disconnect,
  listMessageIds,
  getMessage,
  getMessages,
  // Graph caps Outlook at ~4 concurrent requests per app per mailbox. With
  // batchSize=20 sub-requests, concurrency=2 keeps in-flight at ~40 — below
  // the per-mailbox limit, so per-batch throttle pauses largely disappear.
  concurrency: 2,
  batchSize: BATCH_LIMIT,
};

export async function isMicrosoftConnected(): Promise<boolean> {
  const tokens = await loadTokens();
  return !!tokens?.refreshToken;
}
