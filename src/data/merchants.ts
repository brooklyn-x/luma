import type { Category } from "./types";

export type Merchant = {
  id: string;
  name: string;
  category: Category;
  color: string;
  initial: string;
};

export const merchants: Record<string, Merchant> = {
  swiggy: { id: "swiggy", name: "Swiggy", category: "Food", color: "#FC8019", initial: "S" },
  zomato: { id: "zomato", name: "Zomato", category: "Food", color: "#E23744", initial: "Z" },
  starbucks: { id: "starbucks", name: "Starbucks", category: "Food", color: "#0F704B", initial: "S" },
  bigbasket: { id: "bigbasket", name: "BigBasket", category: "Food", color: "#84B92D", initial: "B" },
  amazon: { id: "amazon", name: "Amazon", category: "Shopping", color: "#FF9900", initial: "A" },
  flipkart: { id: "flipkart", name: "Flipkart", category: "Shopping", color: "#2874F0", initial: "F" },
  apple: { id: "apple", name: "Apple", category: "Shopping", color: "#A2AAAD", initial: "" },
  uber: { id: "uber", name: "Uber", category: "Travel", color: "#10141A", initial: "U" },
  indigo: { id: "indigo", name: "IndiGo", category: "Travel", color: "#0033A0", initial: "I" },
  ola: { id: "ola", name: "Ola", category: "Travel", color: "#9CC227", initial: "O" },
  airtel: { id: "airtel", name: "Airtel", category: "Bills", color: "#E40000", initial: "A" },
  bses: { id: "bses", name: "BSES", category: "Bills", color: "#FFB400", initial: "B" },
  jio: { id: "jio", name: "Jio Fiber", category: "Bills", color: "#0F3CC9", initial: "J" },
  spotify: { id: "spotify", name: "Spotify", category: "Entertainment", color: "#1DB954", initial: "S" },
  netflix: { id: "netflix", name: "Netflix", category: "Entertainment", color: "#E50914", initial: "N" },
  chatgpt: { id: "chatgpt", name: "ChatGPT Plus", category: "Bills", color: "#10A37F", initial: "G" },
  icloud: { id: "icloud", name: "iCloud+", category: "Bills", color: "#0A84FF", initial: "" },
  youtube: { id: "youtube", name: "YouTube Premium", category: "Entertainment", color: "#FF0033", initial: "Y" },
  notion: { id: "notion", name: "Notion", category: "Bills", color: "#FFFFFF", initial: "N" },
  bookmyshow: { id: "bookmyshow", name: "BookMyShow", category: "Entertainment", color: "#C4242D", initial: "B" },
};
