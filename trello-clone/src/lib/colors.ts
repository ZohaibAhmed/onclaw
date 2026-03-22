export const LABEL_COLORS: Record<string, string> = {
  green: "#61bd4f",
  yellow: "#f2d600",
  orange: "#ff9f1a",
  red: "#eb5a46",
  purple: "#c377e0",
  blue: "#0079bf",
  sky: "#00c2e0",
  pink: "#ff78cb",
  black: "#344563",
};

export const LABEL_BG: Record<string, string> = {
  green: "rgba(97,189,79,0.2)",
  yellow: "rgba(242,214,0,0.2)",
  orange: "rgba(255,159,26,0.2)",
  red: "rgba(235,90,70,0.2)",
  purple: "rgba(195,119,224,0.2)",
  blue: "rgba(0,121,191,0.2)",
  sky: "rgba(0,194,224,0.2)",
  pink: "rgba(255,120,203,0.2)",
  black: "rgba(52,69,99,0.3)",
};

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}
