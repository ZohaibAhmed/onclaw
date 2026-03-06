export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export const STAGE_COLORS: Record<string, string> = {
  prospecting: "#6366f1",
  qualification: "#8b5cf6",
  proposal: "#a855f7",
  negotiation: "#f59e0b",
  "closed-won": "#22c55e",
  "closed-lost": "#ef4444",
};

export const STATUS_COLORS: Record<string, string> = {
  lead: "#6366f1",
  customer: "#22c55e",
  churned: "#ef4444",
};
