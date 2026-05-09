import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { env } from "../env";
import { parseFromHeader, stripHtml } from "../email-utils";
import type {
  EmailMessage,
  EmailProvider,
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

async function graphFetch<T>(path: string): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function listMessageIds(opts: ListOptions): Promise<string[]> {
  const ids: string[] = [];
  let initialPath: string;

  if (opts.since) {
    // Incremental: use $filter on receivedDateTime. $filter and $search are
    // mutually exclusive in Graph, so the keyword filter is dropped here —
    // parsers will reject anything that's not a receipt downstream.
    const iso = opts.since.toISOString();
    initialPath =
      `/me/messages` +
      `?$filter=${encodeURIComponent(`receivedDateTime ge ${iso}`)}` +
      `&$orderby=${encodeURIComponent("receivedDateTime desc")}` +
      `&$top=${Math.min(50, opts.max)}` +
      `&$select=id`;
  } else {
    // Full sync: keyword $search ordered by relevance.
    const query =
      "receipt OR invoice OR payment OR order OR transaction OR debited OR charged";
    const search = encodeURIComponent(`"${query}"`);
    initialPath = `/me/messages?$search=${search}&$top=${Math.min(50, opts.max)}&$select=id`;
  }

  let path: string | null = initialPath;
  while (path && ids.length < opts.max) {
    const data: { value?: { id: string }[]; "@odata.nextLink"?: string } =
      await graphFetch(path);
    if (data.value) ids.push(...data.value.map((m) => m.id));
    const next = data["@odata.nextLink"];
    if (next) {
      const url = new URL(next);
      path = `${url.pathname.replace(/^\/v1\.0/, "")}${url.search}`;
    } else {
      path = null;
    }
  }
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

async function getMessage(id: string): Promise<EmailMessage> {
  const msg = await graphFetch<GraphMessage>(
    `/me/messages/${id}?$select=id,subject,from,receivedDateTime,bodyPreview,body`
  );
  const fromAddress = msg.from?.emailAddress?.address ?? "";
  const fromName = msg.from?.emailAddress?.name ?? "";
  const rawBody = msg.body?.content ?? "";
  const body =
    msg.body?.contentType === "text"
      ? rawBody.replace(/\s+/g, " ").trim()
      : stripHtml(rawBody);
  return {
    id: msg.id,
    from: parseFromHeader(`"${fromName}" <${fromAddress}>`),
    subject: msg.subject ?? "",
    body,
    date: msg.receivedDateTime
      ? new Date(msg.receivedDateTime).toISOString()
      : new Date().toISOString(),
    snippet: msg.bodyPreview ?? "",
  };
}

export const microsoftProvider: EmailProvider = {
  signIn,
  disconnect,
  listMessageIds,
  getMessage,
};

export async function isMicrosoftConnected(): Promise<boolean> {
  const tokens = await loadTokens();
  return !!tokens?.refreshToken;
}
