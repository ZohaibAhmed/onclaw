export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export const EVENT_COLORS: Record<string, string> = {
  pageview: "#6366f1",
  click: "#8b5cf6",
  signup: "#22c55e",
  purchase: "#f59e0b",
  custom: "#06b6d4",
  api_call: "#ec4899",
  error: "#ef4444",
};

export const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  starter: "#6366f1",
  pro: "#8b5cf6",
  enterprise: "#f59e0b",
};
