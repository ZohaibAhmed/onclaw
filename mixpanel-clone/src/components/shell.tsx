"use client";

import { OnClawProvider, Slot, useOnClaw } from "onclaw";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Events", icon: "⚡" },
  { href: "/funnels", label: "Funnels", icon: "🔻" },
  { href: "/segments", label: "Segments", icon: "👥" },
  { href: "/retention", label: "Retention", icon: "🔄" },
  { href: "/live", label: "Live View", icon: "🟢" },
];

const MIXPANEL_SLOTS = {
  "events-trend": { name: "Event Trend Chart", description: "Time-series line/area chart of event volume over time" },
  "events-breakdown": { name: "Event Breakdown", description: "Bar chart or table of events by category or name" },
  "events-metrics": { name: "Key Metrics", description: "Summary cards: total events, unique users, avg events/user, top event" },
  "events-top": { name: "Top Events Table", description: "Ranked table of most frequent events with counts and percentages" },
  "funnel-chart": { name: "Funnel Visualization", description: "Step-by-step funnel with conversion rates between stages" },
  "funnel-list": { name: "Funnel List", description: "List of saved funnels with conversion rates" },
  "segments-overview": { name: "Segments Overview", description: "Cards or table of user segments with counts and filters" },
  "segments-breakdown": { name: "Segment Breakdown", description: "Charts breaking down users by plan, country, OS, browser" },
  "retention-chart": { name: "Retention Cohort", description: "Cohort retention heatmap or chart showing user retention over weeks" },
  "retention-curve": { name: "Retention Curve", description: "Line chart showing retention % over time periods" },
  "live-feed": { name: "Live Event Feed", description: "Real-time scrolling feed of incoming events" },
  "live-stats": { name: "Live Stats", description: "Real-time counters: events/min, active users, top event right now" },
};

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <OnClawProvider
      userId="mixpanel-demo-user"
      endpoint="/api/onclaw/generate"
      streamEndpoint="/api/onclaw/stream"
      multiSlot={true}
      smartPrompts={true}
      slots={MIXPANEL_SLOTS}
      rateLimit={{ maxGenerations: 30, windowMs: 60_000 }}
    >
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </OnClawProvider>
  );
}

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-violet-400">Mix</span>panel
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Product Analytics</p>
      </div>

      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <span className="text-violet-400">●</span>
          Acme SaaS
          <span className="ml-auto text-slate-600">▾</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 mt-2">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? "bg-violet-500/10 text-violet-400 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
            ZA
          </div>
          <div>
            <div className="text-xs font-medium">Zohaib Ahmed</div>
            <div className="text-[10px] text-slate-500">Admin</div>
          </div>
        </div>
        <div className="mt-2 px-2">
          <kbd className="text-[10px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">⌘K</kbd>
          <span className="text-[10px] text-slate-600 ml-1.5">to customize</span>
        </div>
      </div>
    </aside>
  );
}

export { Slot, useOnClaw };
