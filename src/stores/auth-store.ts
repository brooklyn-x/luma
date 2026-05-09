import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import type { Provider } from "@/lib/email-provider";
import { getProvider } from "@/lib/email-provider";
import { isGoogleConnected } from "@/lib/providers/google";
import { isMicrosoftConnected } from "@/lib/providers/microsoft";

type AuthState = {
  connected: boolean;
  provider: Provider | null;
  email: string | null;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInMicrosoft: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** @deprecated kept for backward compat — alias of `email` */
  gmailEmail: string | null;
};

const PROVIDER_KEY = "luma_provider";
const EMAIL_KEY = "luma_email";

async function persist(provider: Provider | null, email: string | null) {
  if (provider) {
    await SecureStore.setItemAsync(PROVIDER_KEY, provider);
  } else {
    await SecureStore.deleteItemAsync(PROVIDER_KEY);
  }
  if (email) {
    await SecureStore.setItemAsync(EMAIL_KEY, email);
  } else {
    await SecureStore.deleteItemAsync(EMAIL_KEY);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  connected: false,
  provider: null,
  email: null,
  gmailEmail: null,
  isHydrating: true,
  hydrate: async () => {
    const [providerRaw, email] = await Promise.all([
      SecureStore.getItemAsync(PROVIDER_KEY),
      SecureStore.getItemAsync(EMAIL_KEY),
    ]);
    const provider =
      providerRaw === "google" || providerRaw === "microsoft"
        ? (providerRaw as Provider)
        : null;
    let connected = false;
    if (provider === "google") connected = await isGoogleConnected();
    if (provider === "microsoft") connected = await isMicrosoftConnected();
    set({
      provider: connected ? provider : null,
      email: connected ? email : null,
      gmailEmail: connected ? email : null,
      connected,
      isHydrating: false,
    });
  },
  signInGoogle: async () => {
    const p = await getProvider("google");
    const { email } = await p.signIn();
    await persist("google", email || null);
    set({
      connected: true,
      provider: "google",
      email: email || null,
      gmailEmail: email || null,
    });
  },
  signInMicrosoft: async () => {
    const p = await getProvider("microsoft");
    const { email } = await p.signIn();
    await persist("microsoft", email || null);
    set({
      connected: true,
      provider: "microsoft",
      email: email || null,
      gmailEmail: email || null,
    });
  },
  disconnect: async () => {
    const current = get().provider;
    if (current) {
      try {
        const p = await getProvider(current);
        await p.disconnect();
      } catch {
        // best-effort revoke
      }
    }
    await persist(null, null);
    set({
      connected: false,
      provider: null,
      email: null,
      gmailEmail: null,
    });
  },
}));
