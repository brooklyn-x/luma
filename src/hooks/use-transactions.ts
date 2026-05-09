import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "@/data/types";
import {
  syncTransactions,
  type SyncLogEntry,
  type SyncProgress,
  type SyncResult,
} from "@/lib/sync";
import { useAuthStore } from "@/stores/auth-store";

export const TRANSACTIONS_KEY = ["transactions"] as const;

export type { SyncLogEntry, SyncProgress, SyncResult };

export function useTransactions() {
  const qc = useQueryClient();
  const connected = useAuthStore((s) => s.connected);
  const provider = useAuthStore((s) => s.provider);
  return useQuery<SyncResult>({
    queryKey: TRANSACTIONS_KEY,
    queryFn: () => {
      if (!provider) throw new Error("Not signed in");
      const existing = qc.getQueryData<SyncResult>(TRANSACTIONS_KEY);
      return syncTransactions(provider, undefined, { existing });
    },
    enabled: connected && !!provider,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

export function useSyncMutation(onProgress?: (p: SyncProgress) => void) {
  const qc = useQueryClient();
  const provider = useAuthStore((s) => s.provider);
  return useMutation<SyncResult, Error>({
    mutationFn: () => {
      if (!provider) throw new Error("Not signed in");
      const existing = qc.getQueryData<SyncResult>(TRANSACTIONS_KEY);
      return syncTransactions(provider, onProgress, { existing });
    },
    onSuccess: (data) => {
      qc.setQueryData(TRANSACTIONS_KEY, data);
    },
  });
}

export function selectTransactions(result?: SyncResult): Transaction[] {
  return result?.transactions ?? [];
}

export function selectSyncLog(result?: SyncResult): SyncLogEntry[] {
  return result?.log ?? [];
}
