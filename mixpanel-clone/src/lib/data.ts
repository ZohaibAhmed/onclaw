// Fake analytics data
const days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toISOString().slice(0, 10);
});

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const seed = (s: number) => {
  let x = Math.sin(s) * 10000;
  return x - Math.floor(x);
};

export const DAILY_EVENTS = days.map((day, i) => ({
  date: day,
  pageViews: Math.round(12000 + seed(i * 1) * 8000 + i * 150),
  signups: Math.round(180 + seed(i * 2) * 120 + i * 5),
  purchases: Math.round(45 + seed(i * 3) * 35 + i * 2),
  sessions: Math.round(8000 + seed(i * 4) * 5000 + i * 100),
}));

export const FUNNEL_STEPS = [
  { step: "Page Visit", count: 42580, rate: 100 },
  { step: "Sign Up Started", count: 12450, rate: 29.2 },
  { step: "Email Verified", count: 8930, rate: 71.7 },
  { step: "Onboarding Done", count: 5620, rate: 62.9 },
  { step: "First Purchase", count: 2340, rate: 41.6 },
  { step: "Subscription", count: 1120, rate: 47.9 },
];

export const USER_SEGMENTS = [
  { name: "Power Users", count: 2840, growth: 12.3, color: "#7c5cfc" },
  { name: "Active Users", count: 15200, growth: 8.7, color: "#36b37e" },
  { name: "Casual Users", count: 28400, growth: -2.1, color: "#ffab00" },
  { name: "At Risk", count: 4200, growth: -15.4, color: "#ff5630" },
  { name: "Dormant", count: 8900, growth: 3.2, color: "#6b778c" },
];

export const TOP_EVENTS = [
  { name: "page_view", count: 428500, change: 8.2 },
  { name: "button_click", count: 185200, change: 12.5 },
  { name: "form_submit", count: 42300, change: -3.1 },
  { name: "purchase_complete", count: 12800, change: 15.7 },
  { name: "search_query", count: 67400, change: 22.3 },
  { name: "video_play", count: 34200, change: 5.8 },
  { name: "file_download", count: 18900, change: -1.2 },
  { name: "share_click", count: 23400, change: 9.4 },
];

export const RETENTION_COHORTS = [
  { cohort: "Week 1", day0: 100, day1: 68, day3: 52, day7: 38, day14: 28, day30: 21 },
  { cohort: "Week 2", day0: 100, day1: 71, day3: 55, day7: 41, day14: 30, day30: 23 },
  { cohort: "Week 3", day0: 100, day1: 65, day3: 48, day7: 35, day14: 26, day30: 19 },
  { cohort: "Week 4", day0: 100, day1: 73, day3: 58, day7: 44, day14: 33, day30: null },
];

export const LIVE_EVENTS = [
  { id: "e1", event: "purchase_complete", user: "user_4829", amount: "$49.99", time: "2s ago", location: "San Francisco, US" },
  { id: "e2", event: "page_view", user: "user_1205", page: "/pricing", time: "5s ago", location: "London, UK" },
  { id: "e3", event: "sign_up", user: "user_9481", method: "Google OAuth", time: "8s ago", location: "Berlin, DE" },
  { id: "e4", event: "button_click", user: "user_3302", target: "Start Free Trial", time: "12s ago", location: "Toronto, CA" },
  { id: "e5", event: "search_query", user: "user_7756", query: "integrations", time: "15s ago", location: "Sydney, AU" },
  { id: "e6", event: "purchase_complete", user: "user_2218", amount: "$99.99", time: "18s ago", location: "New York, US" },
  { id: "e7", event: "video_play", user: "user_5540", title: "Product Demo", time: "22s ago", location: "Tokyo, JP" },
  { id: "e8", event: "form_submit", user: "user_8891", form: "Contact Sales", time: "25s ago", location: "Mumbai, IN" },
  { id: "e9", event: "page_view", user: "user_6623", page: "/docs/api", time: "30s ago", location: "Paris, FR" },
  { id: "e10", event: "file_download", user: "user_1149", file: "whitepaper.pdf", time: "35s ago", location: "São Paulo, BR" },
];

export const METRICS = {
  totalUsers: 59540,
  activeToday: 8240,
  eventsToday: 428500,
  revenue: 284200,
  avgSessionTime: "4m 32s",
  bounceRate: 32.1,
};

export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}
