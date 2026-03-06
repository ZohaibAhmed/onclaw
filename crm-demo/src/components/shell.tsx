"use client";

import { ClawKitProvider, Slot, useClawKit } from "clawkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/contacts", label: "Contacts", icon: "👥" },
  { href: "/deals", label: "Deals", icon: "💰" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

const CRM_SLOTS = {
  "dashboard-pipeline": { name: "Pipeline Chart", description: "Revenue pipeline by deal stage — bar or funnel chart" },
  "dashboard-metrics": { name: "Key Metrics", description: "Summary cards: total pipeline, win rate, avg deal size, revenue" },
  "dashboard-leaderboard": { name: "Rep Leaderboard", description: "Top performing sales reps ranked by revenue" },
  "dashboard-activity": { name: "Activity Feed", description: "Recent sales activities (calls, emails, meetings)" },
  "dashboard-monthly": { name: "Monthly Trend", description: "Won vs lost deals over time, line or bar chart" },
  "deals-header": { name: "Pipeline Header", description: "Summary above the deal pipeline kanban board" },
  "contacts-summary": { name: "Contacts Overview", description: "Summary stats about contacts (total, by status, by source)" },
  "analytics-revenue": { name: "Revenue Chart", description: "Monthly revenue trend line chart" },
  "analytics-funnel": { name: "Sales Funnel", description: "Pipeline stage conversion funnel visualization" },
  "analytics-winrate": { name: "Win Rate by Rep", description: "Bar chart comparing win rates across sales reps" },
  "analytics-source": { name: "Lead Sources", description: "Pie or bar chart showing deal revenue by lead source" },
  "analytics-velocity": { name: "Deal Velocity", description: "Average days to close deals by month" },
};

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ClawKitProvider
      userId="crm-demo-user"
      endpoint="/api/clawkit/generate"
      streamEndpoint="/api/clawkit/stream"
      multiSlot={true}
      smartPrompts={true}
      slots={CRM_SLOTS}
      rateLimit={{ maxGenerations: 30, windowMs: 60_000 }}
    >
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ClawKitProvider>
  );
}

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-indigo-400">Sales</span>Forge
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">AI-Powered CRM</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? "bg-indigo-500/10 text-indigo-400 font-medium"
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
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-400">
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

export { Slot, useClawKit };
