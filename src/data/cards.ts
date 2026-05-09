import type { Transaction } from "./types";

export type CardKind = "credit" | "debit" | "upi";

export type Card = {
  id: string;
  paymentSource: string;
  issuer: string;
  productName: string;
  last4: string | null;
  kind: CardKind;
  gradientFrom: string;
  gradientTo: string;
  contrast: "light" | "dark";
};

type IssuerStyle = {
  issuer: string;
  productName: string;
  kind: CardKind;
  gradientFrom: string;
  gradientTo: string;
  contrast: "light" | "dark";
};

const ISSUER_STYLES: Record<string, IssuerStyle> = {
  HDFC: {
    issuer: "HDFC",
    productName: "Bank",
    kind: "credit",
    gradientFrom: "#0F2C6E",
    gradientTo: "#1F4FBF",
    contrast: "light",
  },
  ICICI: {
    issuer: "ICICI",
    productName: "Bank",
    kind: "credit",
    gradientFrom: "#B23A1F",
    gradientTo: "#E2552E",
    contrast: "light",
  },
  Amex: {
    issuer: "American Express",
    productName: "Card",
    kind: "credit",
    gradientFrom: "#1B1D24",
    gradientTo: "#3A3D48",
    contrast: "light",
  },
  SBI: {
    issuer: "SBI",
    productName: "Bank",
    kind: "debit",
    gradientFrom: "#0E2A47",
    gradientTo: "#16447A",
    contrast: "light",
  },
  Axis: {
    issuer: "Axis",
    productName: "Bank",
    kind: "credit",
    gradientFrom: "#5C0F2E",
    gradientTo: "#A02050",
    contrast: "light",
  },
  Kotak: {
    issuer: "Kotak",
    productName: "Bank",
    kind: "credit",
    gradientFrom: "#9A0F1E",
    gradientTo: "#D63240",
    contrast: "light",
  },
  Yes: {
    issuer: "Yes Bank",
    productName: "Bank",
    kind: "credit",
    gradientFrom: "#0033A0",
    gradientTo: "#1E5BD9",
    contrast: "light",
  },
  Federal: {
    issuer: "Federal",
    productName: "Bank",
    kind: "debit",
    gradientFrom: "#1B4D3E",
    gradientTo: "#2E7C68",
    contrast: "light",
  },
  Kiwi: {
    issuer: "Kiwi",
    productName: "UPI Card",
    kind: "credit",
    gradientFrom: "#0D9A4D",
    gradientTo: "#52CB87",
    contrast: "light",
  },
  "SBI Card": {
    issuer: "SBI Card",
    productName: "Credit",
    kind: "credit",
    gradientFrom: "#0A1F4E",
    gradientTo: "#26498F",
    contrast: "light",
  },
  AU: {
    issuer: "AU",
    productName: "Small Finance",
    kind: "credit",
    gradientFrom: "#5C0F2E",
    gradientTo: "#A53560",
    contrast: "light",
  },
  "IDFC First": {
    issuer: "IDFC First",
    productName: "Bank",
    kind: "credit",
    gradientFrom: "#5C0F2E",
    gradientTo: "#9C2755",
    contrast: "light",
  },
  IndusInd: {
    issuer: "IndusInd",
    productName: "Bank",
    kind: "credit",
    gradientFrom: "#5A0E1E",
    gradientTo: "#A02838",
    contrast: "light",
  },
  "GPay UPI": {
    issuer: "Google Pay",
    productName: "UPI",
    kind: "upi",
    gradientFrom: "#F8F9FA",
    gradientTo: "#E8EAED",
    contrast: "dark",
  },
  PhonePe: {
    issuer: "PhonePe",
    productName: "UPI",
    kind: "upi",
    gradientFrom: "#5F259F",
    gradientTo: "#7B3DBF",
    contrast: "light",
  },
  Paytm: {
    issuer: "Paytm",
    productName: "UPI",
    kind: "upi",
    gradientFrom: "#002970",
    gradientTo: "#00B9F1",
    contrast: "light",
  },
  Razorpay: {
    issuer: "Razorpay",
    productName: "Gateway",
    kind: "credit",
    gradientFrom: "#02224C",
    gradientTo: "#3395FF",
    contrast: "light",
  },
  Stripe: {
    issuer: "Stripe",
    productName: "Gateway",
    kind: "credit",
    gradientFrom: "#1F2D5A",
    gradientTo: "#635BFF",
    contrast: "light",
  },
  Card: {
    issuer: "Card",
    productName: "Other",
    kind: "credit",
    gradientFrom: "#3A3D48",
    gradientTo: "#6B6E78",
    contrast: "light",
  },
};

const PAYMENT_SOURCE_RE = /^([A-Za-z][A-Za-z\s]*?)(?:\s*[••]+\s*([0-9]{4}))?$/;

export function parsePaymentSource(paymentSource: string): {
  issuerKey: string;
  last4: string | null;
} {
  const trimmed = paymentSource.trim();
  if (ISSUER_STYLES[trimmed]) {
    return { issuerKey: trimmed, last4: null };
  }
  const match = trimmed.match(PAYMENT_SOURCE_RE);
  if (match) {
    const label = match[1].trim();
    const last4 = match[2] ?? null;
    if (ISSUER_STYLES[label]) {
      return { issuerKey: label, last4 };
    }
  }
  return { issuerKey: "Card", last4: null };
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "card"
  );
}

export function deriveCards(transactions: Transaction[]): Card[] {
  const map = new Map<string, Card>();
  for (const tx of transactions) {
    const ps = tx.paymentSource;
    if (!ps || map.has(ps)) continue;
    const { issuerKey, last4 } = parsePaymentSource(ps);
    const style = ISSUER_STYLES[issuerKey] ?? ISSUER_STYLES.Card;
    map.set(ps, {
      id: slugify(ps),
      paymentSource: ps,
      issuer: style.issuer,
      productName: style.productName,
      last4,
      kind: style.kind,
      gradientFrom: style.gradientFrom,
      gradientTo: style.gradientTo,
      contrast: style.contrast,
    });
  }
  return Array.from(map.values());
}
