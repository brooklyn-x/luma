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

const FROM_RE = /<([^>]+)>/;

export function parseFromHeader(raw: string | undefined): {
  email: string;
  name: string;
} {
  if (!raw) return { email: "", name: "" };
  const m = raw.match(FROM_RE);
  if (m) {
    const email = m[1].trim();
    const name = raw.replace(FROM_RE, "").replace(/"/g, "").trim();
    return { email, name };
  }
  return { email: raw.trim(), name: "" };
}

export const KNOWN_SENDERS = [
  "noreply@swiggy.in",
  "no-reply@zomato.com",
  "auto-confirm@amazon.in",
  "shipment-tracking@amazon.in",
  "order-update@amazon.in",
  "noreply@flipkart.com",
  "no-reply@uber.com",
  "no-reply@olacabs.com",
  "donotreply@goindigo.in",
  "noreply@bigbasket.com",
  "noreply@starbucks.in",
  "no-reply@spotify.com",
  "info@account.netflix.com",
  "no-reply@youtube.com",
  "no_reply@email.apple.com",
  "noreply@tm.openai.com",
  "team@notion.so",
  "noreply@airtel.com",
  "noreply@jio.com",
  "noreply@bsesdelhi.com",
  "no-reply@bookmyshow.com",
  "alerts@hdfcbank.net",
  "alerts@hdfcbank.com",
  "credit_cards@hdfcbank.net",
  "credit_cards.notification@axisbank.com",
  "alerts@axisbank.com",
  "noreply@axisbank.com",
  "donotreply.icicibank@icicibank.com",
  "no-reply@sbi.co.in",
  "alerts@sbi.co.in",
  "noreply@kotak.com",
];
