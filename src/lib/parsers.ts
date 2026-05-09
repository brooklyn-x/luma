import type { Category, Transaction } from "@/data/types";
import type { EmailMessage } from "./email-provider";

export type ParserContext = {
  msg: EmailMessage;
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  date: string;
};

export type Parser = {
  id: string;
  merchantId: string;
  category: Category;
  matches: (ctx: ParserContext) => boolean;
  extract: (
    ctx: ParserContext
  ) => {
    amount: number;
    refId?: string;
    merchantId?: string;
    merchantName?: string;
    category?: Category;
    paymentSource?: string;
    recurring?: boolean;
  } | null;
};

const RUPEE = "(?:Rs\\.?|INR|₹)";
const AMOUNT_RE = new RegExp(
  `${RUPEE}\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)`,
  "i"
);
const AMOUNT_LABELLED_RE =
  /(?:amount|total|paid|charged|debited|spent|grand\s+total)[^0-9]{0,12}([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;

function parseAmount(text: string): number | null {
  const m = text.match(AMOUNT_RE) ?? text.match(AMOUNT_LABELLED_RE);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? n : null;
}

function fromContains(ctx: ParserContext, ...needles: string[]): boolean {
  const f = ctx.fromEmail.toLowerCase();
  return needles.some((n) => f.includes(n.toLowerCase()));
}

function bodyHas(ctx: ParserContext, ...needles: string[]): boolean {
  const b = `${ctx.subject} ${ctx.body}`.toLowerCase();
  return needles.some((n) => b.includes(n.toLowerCase()));
}

const MERCHANT_KEYWORDS: { id: string; category: Category; keywords: string[] }[] = [
  { id: "swiggy", category: "Food", keywords: ["swiggy"] },
  { id: "zomato", category: "Food", keywords: ["zomato"] },
  { id: "amazon", category: "Shopping", keywords: ["amazon", "amzn"] },
  { id: "flipkart", category: "Shopping", keywords: ["flipkart"] },
  { id: "uber", category: "Travel", keywords: ["uber"] },
  { id: "ola", category: "Travel", keywords: ["olacabs", "ola money", "ola "] },
  { id: "indigo", category: "Travel", keywords: ["indigo", "6e"] },
  { id: "bigbasket", category: "Food", keywords: ["bigbasket", "bbnow"] },
  { id: "starbucks", category: "Food", keywords: ["starbucks"] },
  { id: "spotify", category: "Entertainment", keywords: ["spotify"] },
  { id: "netflix", category: "Entertainment", keywords: ["netflix"] },
  { id: "youtube", category: "Entertainment", keywords: ["youtube"] },
  { id: "icloud", category: "Bills", keywords: ["icloud", "apple one"] },
  { id: "apple", category: "Shopping", keywords: ["apple store", "app store"] },
  { id: "chatgpt", category: "Bills", keywords: ["chatgpt", "openai"] },
  { id: "notion", category: "Bills", keywords: ["notion"] },
  { id: "airtel", category: "Bills", keywords: ["airtel"] },
  { id: "jio", category: "Bills", keywords: ["jio"] },
  { id: "bses", category: "Bills", keywords: ["bses"] },
  { id: "bookmyshow", category: "Entertainment", keywords: ["bookmyshow", "bms"] },
];

function detectMerchantFromText(
  text: string
): { merchantId: string; category: Category } | null {
  const tl = text.toLowerCase();
  for (const m of MERCHANT_KEYWORDS) {
    if (m.keywords.some((k) => tl.includes(k))) {
      return { merchantId: m.id, category: m.category };
    }
  }
  return null;
}

function categoryFromKeywords(text: string): Category {
  const tl = text.toLowerCase();
  if (
    /(zomato|swiggy|restaurant|food|dining|cafe|bakery|biryani|pizza|burger|barbeque|haldiram|domino)/.test(
      tl
    )
  )
    return "Food";
  if (/(uber|ola|rapido|metro|irctc|indigo|spicejet|vistara|flight|booking\.com|makemytrip|goibibo|cab|airline)/.test(tl))
    return "Travel";
  if (
    /(amazon|flipkart|myntra|ajio|nykaa|tata cliq|order|shipment|delivered|purchase)/.test(
      tl
    )
  )
    return "Shopping";
  if (/(netflix|spotify|prime video|hotstar|youtube|jiocinema|bookmyshow|movie)/.test(tl))
    return "Entertainment";
  return "Bills";
}

const MERCHANT_PARSERS: Parser[] = [
  {
    id: "swiggy",
    merchantId: "swiggy",
    category: "Food",
    matches: (c) => fromContains(c, "swiggy.in", "swiggy.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "zomato",
    merchantId: "zomato",
    category: "Food",
    matches: (c) => fromContains(c, "zomato.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "amazon",
    merchantId: "amazon",
    category: "Shopping",
    matches: (c) => fromContains(c, "amazon.in", "amazon.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      const order = c.body.match(/(?:Order(?:\s*#|\s+ID[:\s]+))\s*([A-Z0-9-]+)/i);
      if (!amount) return null;
      return { amount, refId: order?.[1] };
    },
  },
  {
    id: "flipkart",
    merchantId: "flipkart",
    category: "Shopping",
    matches: (c) => fromContains(c, "flipkart.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      const order = c.body.match(/OD[0-9]{8,}/);
      if (!amount) return null;
      return { amount, refId: order?.[0] };
    },
  },
  {
    id: "uber",
    merchantId: "uber",
    category: "Travel",
    matches: (c) => fromContains(c, "uber.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "ola",
    merchantId: "ola",
    category: "Travel",
    matches: (c) => fromContains(c, "olacabs.com", "olamoney.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "indigo",
    merchantId: "indigo",
    category: "Travel",
    matches: (c) => fromContains(c, "goindigo.in", "indigo.in"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      const pnr = c.body.match(/PNR[:\s]+([A-Z0-9]{6})/i);
      if (!amount) return null;
      return { amount, refId: pnr?.[1] };
    },
  },
  {
    id: "bigbasket",
    merchantId: "bigbasket",
    category: "Food",
    matches: (c) => fromContains(c, "bigbasket.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "starbucks",
    merchantId: "starbucks",
    category: "Food",
    matches: (c) => fromContains(c, "starbucks.in"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "spotify",
    merchantId: "spotify",
    category: "Entertainment",
    matches: (c) => fromContains(c, "spotify.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "netflix",
    merchantId: "netflix",
    category: "Entertainment",
    matches: (c) => fromContains(c, "netflix.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "youtube",
    merchantId: "youtube",
    category: "Entertainment",
    matches: (c) =>
      (fromContains(c, "youtube.com") ||
        (fromContains(c, "google.com") && bodyHas(c, "YouTube Premium", "YouTube Music"))),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "icloud",
    merchantId: "icloud",
    category: "Bills",
    matches: (c) =>
      fromContains(c, "apple.com", "email.apple.com") &&
      bodyHas(c, "iCloud", "Apple One"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "apple",
    merchantId: "apple",
    category: "Shopping",
    matches: (c) =>
      fromContains(c, "apple.com") &&
      bodyHas(c, "Your receipt", "Apple Store", "App Store"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "chatgpt",
    merchantId: "chatgpt",
    category: "Bills",
    matches: (c) =>
      fromContains(c, "openai.com", "stripe.com") &&
      bodyHas(c, "ChatGPT", "OpenAI"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "notion",
    merchantId: "notion",
    category: "Bills",
    matches: (c) => fromContains(c, "notion.so", "makenotion.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "airtel",
    merchantId: "airtel",
    category: "Bills",
    matches: (c) => fromContains(c, "airtel.com", "airtel.in"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "jio",
    merchantId: "jio",
    category: "Bills",
    matches: (c) => fromContains(c, "jio.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "bses",
    merchantId: "bses",
    category: "Bills",
    matches: (c) => fromContains(c, "bsesdelhi.com", "bses.co.in"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
  {
    id: "bookmyshow",
    merchantId: "bookmyshow",
    category: "Entertainment",
    matches: (c) => fromContains(c, "bookmyshow.com"),
    extract: (c) => {
      const amount = parseAmount(c.body) ?? parseAmount(c.subject);
      return amount ? { amount } : null;
    },
  },
];

type BankConfig = {
  domains: string[];
  paymentLabel: string;
  cardRe: RegExp;
};

const CARD_LAST4_RE =
  /(?:card|account|a\/c)\s*(?:no\.?|number|ending|xx+)?\s*[:\-]?\s*(?:[xX*•]+)\s*([0-9]{4})/i;

const BANKS: BankConfig[] = [
  {
    domains: ["hdfcbank.net", "hdfcbank.com", "hdfcbank.bank.in"],
    paymentLabel: "HDFC",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: [
      "icicibank.com",
      "alerts.icicibank.com",
      "credit_cards.icicibank.com",
    ],
    paymentLabel: "ICICI",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: [
      "sbi.co.in",
      "onlinesbi.com",
      "alerts.sbi",
      "alerts.sbi.co.in",
      "mailer.sbi",
    ],
    paymentLabel: "SBI",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: ["sbicard.com"],
    paymentLabel: "SBI Card",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: ["axisbank.com"],
    paymentLabel: "Axis",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: ["kotak.com"],
    paymentLabel: "Kotak",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: [
      "yes.bank.in",
      "yesbank.in",
      "yesbank.co.in",
      "alerts.yesbank.in",
    ],
    paymentLabel: "Yes",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: ["federalbank.co.in", "federalbank.in"],
    paymentLabel: "Federal",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: ["gokiwi.com", "kiwi.tech", "kiwi.in"],
    paymentLabel: "Kiwi",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: ["aubank.in"],
    paymentLabel: "AU",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: ["idfcfirstbank.com"],
    paymentLabel: "IDFC First",
    cardRe: CARD_LAST4_RE,
  },
  {
    domains: ["indusind.com"],
    paymentLabel: "IndusInd",
    cardRe: CARD_LAST4_RE,
  },
];

const BANK_NOISE_RE =
  /\b(?:OTP|one\s*time\s*password|e[-\s]?mandate\s+(?:set|registration|registered)|registration\s+success|complimentary|gift|offer|exclusive\s+offer|rewards?\s+earned|cashback\s+credited)\b/i;

const BANK_TRANSACTION_RE =
  /\b(?:debited|spent|paid|charged|sent|withdrawn|purchase|upi\s+txn|transaction\s+alert|paid\s+to|payment\s+made|transferred)\b/i;

function findBank(ctx: ParserContext): BankConfig | null {
  return BANKS.find((b) => fromContains(ctx, ...b.domains)) ?? null;
}

const MERCHANT_NEAR_RE =
  /(?:at|to|towards|in favour of|merchant|payee|info[:\s])\s+([A-Za-z][A-Za-z0-9 ._&'/@-]{2,60}?)(?=\s+(?:on|for|via|using|at\s+\d|with|dated|\.)|[,;:]|$)/i;

function prettifyMerchant(raw: string): string {
  let s = raw.trim();
  // Strip common UPI prefixes: "UPI_FOO BAR" / "UPI/FOO BAR" / "UPI-FOO BAR"
  s = s.replace(/^upi[\s_/-]+/i, "");
  // Replace underscores/dashes with spaces, collapse whitespace
  s = s.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  // Title-case each word
  return s
    .split(" ")
    .map((w) =>
      w.length === 0
        ? w
        : /^[A-Z]+$/.test(w) && w.length <= 4
          ? w
          : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(" ");
}

function slugifyMerchant(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "unknown"
  );
}

function bankParserExtract(ctx: ParserContext, bank: BankConfig) {
  const text = `${ctx.subject} ${ctx.body}`;
  if (BANK_NOISE_RE.test(ctx.subject)) return null;
  if (!BANK_TRANSACTION_RE.test(text)) return null;
  const isCredit = /\b(credited|received|refund(?:ed)?)\b/i.test(text) &&
    !/\b(debited|spent|paid|charged|sent|withdrawn|purchase)\b/i.test(text);
  if (isCredit) return null;

  const amount = parseAmount(text);
  if (!amount) return null;

  const last4 = text.match(bank.cardRe);
  const paymentSource = last4 ? `${bank.paymentLabel} ••${last4[1]}` : bank.paymentLabel;

  const merchantHit = detectMerchantFromText(text);
  const merchantNameMatch = text.match(MERCHANT_NEAR_RE);
  const rawMerchant = merchantNameMatch?.[1]?.trim();
  const prettyMerchant = rawMerchant ? prettifyMerchant(rawMerchant) : null;
  const merchantId =
    merchantHit?.merchantId ??
    (prettyMerchant ? slugifyMerchant(prettyMerchant) : "unknown");
  const merchantName = merchantHit ? undefined : prettyMerchant ?? undefined;
  const category = merchantHit?.category ?? categoryFromKeywords(text);

  const refMatch =
    text.match(/(?:UPI\s*Ref|UPI\s*Reference|Ref\s*No|Txn\s*ID|Transaction\s*ID)[:\s]+([A-Z0-9-]{6,})/i);

  return {
    amount,
    paymentSource,
    merchantId,
    merchantName,
    category,
    refId: refMatch?.[1],
    recurring: /(auto[-\s]?pay|standing instruction|si\s+executed|recurring)/i.test(text),
  };
}

const BANK_PARSER: Parser = {
  id: "bank-alert",
  merchantId: "unknown",
  category: "Bills",
  matches: (c) => findBank(c) !== null,
  extract: (c) => {
    const bank = findBank(c);
    if (!bank) return null;
    return bankParserExtract(c, bank);
  },
};

const PAYMENT_GATEWAYS = [
  { domain: "razorpay.com", label: "Razorpay" },
  { domain: "stripe.com", label: "Stripe" },
  { domain: "paytm.com", label: "Paytm" },
  { domain: "phonepe.com", label: "PhonePe" },
  { domain: "googlepay.com", label: "GPay UPI" },
  { domain: "google.com/pay", label: "GPay UPI" },
];

const GATEWAY_PARSER: Parser = {
  id: "gateway",
  merchantId: "unknown",
  category: "Bills",
  matches: (c) => PAYMENT_GATEWAYS.some((g) => fromContains(c, g.domain)),
  extract: (c) => {
    const text = `${c.subject} ${c.body}`;
    if (!/(payment|debited|paid|receipt|invoice|charged|order)/i.test(text)) return null;
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchantHit = detectMerchantFromText(text);
    const category = merchantHit?.category ?? categoryFromKeywords(text);
    const merchantId = merchantHit?.merchantId ?? "unknown";
    const gateway = PAYMENT_GATEWAYS.find((g) => fromContains(c, g.domain));
    return {
      amount,
      merchantId,
      category,
      paymentSource: gateway?.label ?? "Card",
    };
  },
};

const GENERIC_RECEIPT_PARSER: Parser = {
  id: "generic-receipt",
  merchantId: "unknown",
  category: "Bills",
  matches: (c) => {
    const text = `${c.subject} ${c.body}`.toLowerCase();
    return (
      /receipt|invoice|order confirmation|payment received|your order|booking confirmed|payment successful/.test(
        text
      ) && /[₹]|rs\.?\s*\d|inr\s*\d/i.test(text)
    );
  },
  extract: (c) => {
    const text = `${c.subject} ${c.body}`;
    const amount = parseAmount(text);
    if (!amount) return null;
    const merchantHit = detectMerchantFromText(text);
    const merchantId = merchantHit?.merchantId ?? domainToSlug(c.fromEmail);
    const category = merchantHit?.category ?? categoryFromKeywords(text);
    return { amount, merchantId, category };
  },
};

function domainToSlug(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return "unknown";
  const host = email.slice(at + 1).toLowerCase();
  const parts = host.split(".");
  const root = parts.length >= 2 ? parts[parts.length - 2] : host;
  return root || "unknown";
}

const PARSERS: Parser[] = [
  ...MERCHANT_PARSERS,
  BANK_PARSER,
  GATEWAY_PARSER,
  GENERIC_RECEIPT_PARSER,
];

function detectPaymentSource(text: string): string {
  const tl = text.toLowerCase();
  const last4 = text.match(/(?:card|account)\s+(?:ending|xx+)\s*([0-9]{4})/i);
  if (tl.includes("hdfc")) return last4 ? `HDFC ••${last4[1]}` : "HDFC";
  if (tl.includes("icici")) return last4 ? `ICICI ••${last4[1]}` : "ICICI";
  if (tl.includes("amex") || tl.includes("american express"))
    return last4 ? `Amex ••${last4[1]}` : "Amex";
  if (tl.includes("axis")) return last4 ? `Axis ••${last4[1]}` : "Axis";
  if (tl.includes("kotak")) return last4 ? `Kotak ••${last4[1]}` : "Kotak";
  if (tl.includes("sbi")) return last4 ? `SBI ••${last4[1]}` : "SBI";
  if (tl.includes("upi") || tl.includes("gpay") || tl.includes("google pay"))
    return "GPay UPI";
  if (tl.includes("phonepe")) return "PhonePe";
  if (tl.includes("paytm")) return "Paytm";
  return "Card";
}

function detectRecurring(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("subscription") ||
    t.includes("auto-renew") ||
    t.includes("auto renew") ||
    t.includes("renewed") ||
    t.includes("recurring") ||
    t.includes("auto pay") ||
    t.includes("standing instruction")
  );
}

export function parseMessage(msg: EmailMessage): Transaction | null {
  const ctx: ParserContext = {
    msg,
    fromEmail: msg.from.email,
    fromName: msg.from.name,
    subject: msg.subject,
    body: msg.body,
    date: msg.date,
  };

  for (const parser of PARSERS) {
    if (!parser.matches(ctx)) continue;
    const out = parser.extract(ctx);
    if (!out) continue;
    const snippet = (msg.snippet ?? msg.body).slice(0, 220);
    const combined = `${msg.subject} ${msg.body}`;
    return {
      id: msg.id,
      merchantId: out.merchantId ?? parser.merchantId,
      merchantName: out.merchantName,
      amount: out.amount,
      category: out.category ?? parser.category,
      date: msg.date,
      recurring: out.recurring ?? detectRecurring(combined),
      paymentSource: out.paymentSource ?? detectPaymentSource(combined),
      gmailSnippet: snippet,
      refId: out.refId ?? msg.id.slice(0, 10).toUpperCase(),
    };
  }
  return null;
}

