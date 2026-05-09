export const colorsDark = {
  background: "#0B0B0D",
  surface: "#151518",
  elevated: "#1D1D22",
  card: "#18181C",
  border: "#2A2A31",
  text: "#FFFFFF",
  muted: "#B6B6C2",
  blue: "#5B8CFF",
  purple: "#8B5CF6",
  green: "#34D399",
  red: "#FF6B6B",
  yellow: "#FACC15",
  pink: "#F472B6",
  tileFill: "rgba(255,255,255,0.045)",
  tileBorder: "rgba(255,255,255,0.08)",
  tileHighlight: "rgba(255,255,255,0.10)",
  innerRing: "rgba(255,255,255,0.10)",
  liveOverlay: "rgba(20,20,24,0.32)",
} as const;

export const colorsLight = {
  background: "#FFFFFF",
  surface: "#F2F2F7",
  elevated: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E5E5EA",
  text: "#0B0B0D",
  muted: "#6E6E73",
  blue: "#5B8CFF",
  purple: "#8B5CF6",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#EAB308",
  pink: "#EC4899",
  tileFill: "rgba(0,0,0,0.04)",
  tileBorder: "rgba(0,0,0,0.08)",
  tileHighlight: "rgba(0,0,0,0.06)",
  innerRing: "rgba(0,0,0,0.08)",
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
