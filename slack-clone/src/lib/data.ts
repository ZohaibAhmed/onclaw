export type User = { id: string; name: string; avatar: string; status: "online" | "away" | "offline"; title: string };
export type Channel = { id: string; name: string; description: string; isPrivate: boolean; unread: number; members: number };
export type Message = { id: string; userId: string; channelId: string; text: string; timestamp: Date; reactions?: { emoji: string; count: number; users: string[] }[]; threadCount?: number };
export type DM = { id: string; userId: string; lastMessage: string; unread: number };

export const USERS: User[] = [
  { id: "u1", name: "Zohaib Ahmed", avatar: "ZA", status: "online", title: "Engineering Lead" },
  { id: "u2", name: "Sarah Chen", avatar: "SC", status: "online", title: "Product Manager" },
  { id: "u3", name: "Marcus Rivera", avatar: "MR", status: "away", title: "Senior Designer" },
  { id: "u4", name: "Emily Zhang", avatar: "EZ", status: "online", title: "Full Stack Dev" },
  { id: "u5", name: "James Wilson", avatar: "JW", status: "offline", title: "DevOps Engineer" },
  { id: "u6", name: "Priya Patel", avatar: "PP", status: "online", title: "Data Scientist" },
  { id: "u7", name: "Alex Kim", avatar: "AK", status: "away", title: "Frontend Dev" },
  { id: "u8", name: "Rachel Green", avatar: "RG", status: "online", title: "QA Lead" },
];

export const CHANNELS: Channel[] = [
  { id: "c1", name: "general", description: "Company-wide announcements and work-based matters", isPrivate: false, unread: 3, members: 48 },
  { id: "c2", name: "engineering", description: "Engineering team discussions", isPrivate: false, unread: 12, members: 18 },
  { id: "c3", name: "product", description: "Product planning and roadmap", isPrivate: false, unread: 0, members: 12 },
  { id: "c4", name: "design", description: "Design reviews and feedback", isPrivate: false, unread: 5, members: 8 },
  { id: "c5", name: "random", description: "Non-work banter and water cooler talk", isPrivate: false, unread: 0, members: 45 },
  { id: "c6", name: "incidents", description: "Production incident tracking", isPrivate: true, unread: 1, members: 10 },
  { id: "c7", name: "launches", description: "Product launch coordination", isPrivate: true, unread: 0, members: 15 },
  { id: "c8", name: "standup", description: "Daily standup updates", isPrivate: false, unread: 8, members: 20 },
];

const now = Date.now();
const h = (hours: number) => new Date(now - hours * 3600000);
const m = (mins: number) => new Date(now - mins * 60000);

export const MESSAGES: Message[] = [
  { id: "m1", userId: "u2", channelId: "c1", text: "Hey everyone! 🎉 We just hit 10k daily active users on the new dashboard. Huge shoutout to the engineering team!", timestamp: m(5), reactions: [{ emoji: "🎉", count: 12, users: ["u1","u3","u4"] }, { emoji: "🚀", count: 8, users: ["u5","u6"] }] },
  { id: "m2", userId: "u1", channelId: "c1", text: "Amazing work team! The performance improvements really paid off.", timestamp: m(4) },
  { id: "m3", userId: "u4", channelId: "c1", text: "Thanks! The caching layer made a huge difference — response times dropped 60%", timestamp: m(3), threadCount: 4 },
  { id: "m4", userId: "u6", channelId: "c1", text: "The analytics show really strong retention too. Users who try the new features stick around 3x longer.", timestamp: m(2) },
  { id: "m5", userId: "u3", channelId: "c1", text: "I've updated the design system docs with the new component variants. Check #design for details.", timestamp: m(1) },

  { id: "m10", userId: "u1", channelId: "c2", text: "PR #847 is ready for review — refactored the auth middleware to support OAuth2 PKCE flow", timestamp: m(15), reactions: [{ emoji: "👀", count: 3, users: ["u4","u5"] }] },
  { id: "m11", userId: "u4", channelId: "c2", text: "Looking at it now. Quick question — are we keeping backward compat with the old token format?", timestamp: m(12) },
  { id: "m12", userId: "u1", channelId: "c2", text: "Yes, there's a migration path. Old tokens get auto-upgraded on next refresh. Added tests for that.", timestamp: m(10) },
  { id: "m13", userId: "u5", channelId: "c2", text: "CI is green ✅ Performance benchmarks look good too — no regression on auth latency", timestamp: m(8), reactions: [{ emoji: "✅", count: 5, users: ["u1","u4","u7"] }] },
  { id: "m14", userId: "u7", channelId: "c2", text: "Approved! Nice clean implementation. Love the error handling improvements.", timestamp: m(5) },
  { id: "m15", userId: "u1", channelId: "c2", text: "Merged! 🎯 Deploying to staging now", timestamp: m(2) },

  { id: "m20", userId: "u2", channelId: "c3", text: "Q2 roadmap draft is up in Notion. Key themes: AI features, mobile improvements, enterprise SSO", timestamp: h(2), threadCount: 7 },
  { id: "m21", userId: "u3", channelId: "c3", text: "Love the AI direction. I've been sketching some concepts for the command palette integration.", timestamp: h(1.5) },
  { id: "m22", userId: "u6", channelId: "c3", text: "For the AI features — I have a prototype of the smart search that uses embeddings. Can demo Thursday.", timestamp: h(1) },

  { id: "m30", userId: "u3", channelId: "c4", text: "New design system v3.0 is live! 🎨 Major changes: updated color tokens, new spacing scale, icon refresh", timestamp: h(3), reactions: [{ emoji: "🎨", count: 6, users: ["u2","u7"] }] },
  { id: "m31", userId: "u7", channelId: "c4", text: "The new icon set looks incredible. Already migrating the nav components.", timestamp: h(2.5) },
  { id: "m32", userId: "u3", channelId: "c4", text: "Here's the Figma link: figma.com/file/... — all components are in the 'Production' page", timestamp: h(2) },
  { id: "m33", userId: "u2", channelId: "c4", text: "Can we add dark mode variants for the new card components? Customers have been asking.", timestamp: h(1) },
  { id: "m34", userId: "u3", channelId: "c4", text: "Already in progress! Should have them by EOD tomorrow.", timestamp: m(45) },

  { id: "m40", userId: "u8", channelId: "c5", text: "Anyone up for lunch at the new ramen place? 🍜", timestamp: m(30) },
  { id: "m41", userId: "u4", channelId: "c5", text: "Count me in! 🙋‍♀️", timestamp: m(25), reactions: [{ emoji: "🍜", count: 4, users: ["u1","u3","u6"] }] },
  { id: "m42", userId: "u6", channelId: "c5", text: "Is it the one on 3rd? I heard they have amazing tonkotsu", timestamp: m(20) },

  { id: "m50", userId: "u5", channelId: "c6", text: "⚠️ Alert: Elevated error rates on API gateway. Investigating now.", timestamp: m(45) },
  { id: "m51", userId: "u5", channelId: "c6", text: "Root cause: connection pool exhaustion on db-replica-3. Scaling up and draining connections.", timestamp: m(30) },
  { id: "m52", userId: "u1", channelId: "c6", text: "Added a circuit breaker for the replica failover. PR #852 — hotfix.", timestamp: m(20) },
  { id: "m53", userId: "u5", channelId: "c6", text: "✅ Resolved. Error rates back to baseline. RCA doc coming tomorrow.", timestamp: m(10), reactions: [{ emoji: "🙏", count: 6, users: ["u2","u4","u8"] }] },

  { id: "m60", userId: "u4", channelId: "c8", text: "**Standup — Emily Z**\n✅ Yesterday: Shipped notification preferences UI\n🔨 Today: Starting WebSocket integration for real-time updates\n🚫 Blockers: None", timestamp: h(1) },
  { id: "m61", userId: "u7", channelId: "c8", text: "**Standup — Alex K**\n✅ Yesterday: Finished responsive tables component\n🔨 Today: Dark mode fixes, PR reviews\n🚫 Blockers: Waiting on design specs for mobile nav", timestamp: m(55) },
  { id: "m62", userId: "u5", channelId: "c8", text: "**Standup — James W**\n✅ Yesterday: Set up Terraform for new staging env\n🔨 Today: Incident RCA, monitoring dashboards\n🚫 Blockers: Need AWS access for prod-west region", timestamp: m(50) },
];

export const DMS: DM[] = [
  { id: "d1", userId: "u2", lastMessage: "Let's sync on the roadmap at 2pm", unread: 1 },
  { id: "d2", userId: "u4", lastMessage: "Pushed the fix — check staging", unread: 0 },
  { id: "d3", userId: "u5", lastMessage: "Incident resolved 👍", unread: 0 },
  { id: "d4", userId: "u3", lastMessage: "New mockups attached", unread: 2 },
];

export function getUser(id: string) { return USERS.find(u => u.id === id); }
export function getChannelMessages(channelId: string) { return MESSAGES.filter(m => m.channelId === channelId); }
export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
