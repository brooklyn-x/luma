export type Category = "Food" | "Shopping" | "Travel" | "Bills" | "Entertainment";

export type Direction = "debit" | "credit";
export type TxKind = "purchase" | "card-payment";

export type Transaction = {
  id: string;
  merchantId: string;
  merchantName?: string;
  amount: number;
  category: Category;
  date: string;
  recurring: boolean;
  paymentSource: string;
  gmailSnippet: string;
  refId: string;
  direction: Direction;
  kind: TxKind;
};

export type Bill = {
  id: string;
  emailId: string;
  issuer: string;
  cardLast4?: string;
  totalDue: number;
  minDue?: number;
  statementDate?: string;
  dueDate: string;
};

export type Subscription = {
  id: string;
  merchantId: string;
  amount: number;
  cycle: "monthly" | "yearly";
  nextRenewal: string;
  startedAt: string;
};
