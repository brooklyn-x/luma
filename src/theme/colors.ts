export const colorsDark = {
  background: "#0E0E12",
  surface: "#151518",
  elevated: "#1D1D22",
  card: "#1A1A21",
  border: "#2A2A31",
  text: "#FFFFFF",
  muted: "#8E8E98",
  muted2: "#5E5E68",
  inactive: "#56565E",
  blue: "#5B8CFF",
  purple: "#8B5CF6",
  green: "#34D399",
  red: "#FF6B6B",
  yellow: "#FACC15",
  pink: "#F472B6",
  lime: "#C6F24E",
  limeStrong: "#A8E22E",
  limeInk: "#1A2E05",
  limeSoft: "rgba(92,154,0,0.20)",
  limeSoftInk: "#A8E22E",
  limeMid: "#C6F24E",
  divider: "rgba(255,255,255,0.08)",
  tileFill: "#1A1A21",
  tileBorder: "rgba(255,255,255,0.08)",
  tileHighlight: "rgba(255,255,255,0.10)",
  innerRing: "rgba(255,255,255,0.10)",
  liveOverlay: "rgba(20,20,24,0.32)",
} as const;

export const colorsLight = {
  background: "#F3F3F4",
  surface: "#F2F2F7",
  elevated: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E5E5EA",
  text: "#131316",
  muted: "#9A9AA0",
  muted2: "#B6B6BC",
  inactive: "#AFAFB6",
  blue: "#5B8CFF",
  purple: "#8B5CF6",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#EAB308",
  pink: "#EC4899",
  lime: "#C6F24E",
  limeStrong: "#A8E22E",
  limeInk: "#1A2E05",
  limeSoft: "#EAF9C4",
  limeSoftInk: "#3C6E00",
  limeMid: "#5C9A00",
  divider: "#F0F0F2",
  tileFill: "#FFFFFF",
  tileBorder: "rgba(0,0,0,0.07)",
  tileHighlight: "rgba(0,0,0,0.05)",
  innerRing: "rgba(0,0,0,0.07)",
  liveOverlay: "rgba(255,255,255,0.2)",
} as const;

export type Palette = { -readonly [K in keyof typeof colorsDark]: string };

export const colors = colorsDark;

export const gradient = {
  primary: ["#5B8CFF", "#8B5CF6"] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

export const categoryColors: Record<string, string> = {
  Food: "#FF6B6B",
  Shopping: "#8B5CF6",
  Travel: "#5B8CFF",
  Bills: "#34D399",
  Entertainment: "#F472B6",
};

export type Colors = typeof colorsDark;
