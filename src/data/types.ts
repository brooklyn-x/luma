export type Category = "Food" | "Shopping" | "Travel" | "Bills" | "Entertainment";

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
};

export type Subscription = {
  id: string;
  merchantId: string;
  amount: number;
  cycle: "monthly" | "yearly";
  nextRenewal: string;
  startedAt: string;
};
