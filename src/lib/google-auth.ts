import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { env } from "./env";

WebBrowser.maybeCompleteAuthSession();

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
];

const TOKENS_KEY = "luma_google_tokens";

export type GoogleTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  idToken?: string;
  email?: string;
};

function getClientId(): string {
  if (Platform.OS === "ios") return env.googleIosClientId;
  if (Platform.OS === "android") return env.googleAndroidClientId;
  return env.googleWebClientId;
}

function getRedirectUri(clientId: string): string {
  if (Platform.OS === "ios") {
    const scheme = env.googleIosUrlScheme;
    if (!scheme) {
      throw new Error(
        "EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME missing. Set the reversed iOS client ID in .env."
      );
    }
    return `${scheme}:/oauth2redirect`;
  }
  if (Platform.OS === "android") {
    return AuthSession.makeRedirectUri({ scheme: "luma", path: "oauthredirect" });
  }
  return AuthSession.makeRedirectUri({
    scheme: "luma",
    path: "oauthredirect",
    preferLocalhost: true,
  });
}

function decodeIdTokenEmail(idToken?: string): string | undefined {
  if (!idToken) return undefined;
  try {
    const payload = idToken.split(".")[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = globalThis.atob
      ? globalThis.atob(normalized)
      : Buffer.from(normalized, "base64").toString("binary");
    const json = JSON.parse(decoded) as { email?: string };
    return json.email;
  } catch {
    return undefined;
  }
}

export async function loadTokens(): Promise<GoogleTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleTokens;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: GoogleTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}

export async function signInWithGoogle(): Promise<GoogleTokens> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error(
      "Google client ID missing. Set EXPO_PUBLIC_GOOGLE_*_CLIENT_ID in .env."
    );
  }
  const redirectUri = getRedirectUri(clientId);

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: SCOPES,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });

  const authUrl = await request.makeAuthUrlAsync(discovery);
  console.log("[google-auth] redirectUri:", redirectUri);
  console.log("[google-auth] authUrl:", authUrl);
  const result = await request.promptAsync(discovery);
  console.log("[google-auth] result:", JSON.stringify(result, null, 2));

  if (result.type !== "success") {
    if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error("Sign-in cancelled");
    }
    if (result.type === "error") {
      const errParams = (result as { params?: Record<string, string> }).params;
      const errorReason =
        errParams?.error_description ?? errParams?.error ?? result.type;
      throw new Error(`Google error: ${errorReason}`);
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
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : undefined,
    },
    discovery
  );

  if (!tokenResponse.refreshToken) {
    throw new Error(
      "No refresh token returned. Revoke app access at myaccount.google.com and try again."
    );
  }

  const tokens: GoogleTokens = {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
    idToken: tokenResponse.idToken,
    email: decodeIdTokenEmail(tokenResponse.idToken),
  };
  await saveTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokens> {
  const clientId = getClientId();
  const tokenResponse = await AuthSession.refreshAsync(
    { clientId, refreshToken },
    discovery
  );
  const existing = await loadTokens();
  const tokens: GoogleTokens = {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken ?? refreshToken,
    expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
    idToken: tokenResponse.idToken ?? existing?.idToken,
    email: decodeIdTokenEmail(tokenResponse.idToken) ?? existing?.email,
  };
  await saveTokens(tokens);
  return tokens;
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error("Not signed in");
  const skewMs = 60_000;
  if (Date.now() < tokens.expiresAt - skewMs) {
    return tokens.accessToken;
  }
  const refreshed = await refreshAccessToken(tokens.refreshToken);
  return refreshed.accessToken;
}

export async function revokeAndClear(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens?.refreshToken) {
    try {
      await AuthSession.revokeAsync(
        { token: tokens.refreshToken },
        { revocationEndpoint: discovery.revocationEndpoint! }
      );
    } catch {
      // ignore — revoke best-effort
    }
  }
  await clearTokens();
}
