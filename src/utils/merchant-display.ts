import { merchants } from "@/data/merchants";

export function displayName(merchantId: string, fallback?: string): string {
  const known = merchants[merchantId];
  if (known) return known.name;

  const raw = (fallback ?? merchantId).trim();
  let cleaned = raw.replace(/^(VPA|UPI|NEFT|IMPS|RTGS)[\s:]+/i, "");
  cleaned = cleaned.split("@")[0];
  const words = cleaned.split(/[\s.]+/).filter(Boolean).slice(0, 2);
  cleaned = words.join(" ").slice(0, 28).trim();
  return cleaned || merchantId;
}

const PALETTE = [
  "#5B8CFF",
  "#8B5CF6",
  "#34D399",
  "#F472B6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#06B6D4",
];

export function deterministicColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
