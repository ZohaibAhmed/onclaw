export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export const STATUS_COLORS: Record<string, string> = {
  online: "#22c55e",
  away: "#f59e0b",
  dnd: "#ef4444",
  offline: "#6b7280",
};
