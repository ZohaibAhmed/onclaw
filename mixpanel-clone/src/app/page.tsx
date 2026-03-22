"use client";

import { OnClawProvider, Slot, useOnClaw } from "onclaw";
import { useState } from "react";
import { DAILY_EVENTS, FUNNEL_STEPS, USER_SEGMENTS, TOP_EVENTS, RETENTION_COHORTS, LIVE_EVENTS, METRICS, formatNum, formatMoney } from "@/lib/data";

const MIXPANEL_SLOTS = {
  "dashboard-metrics": { name: "Key Metrics", description: "Top-level KPI cards showing total users, active today, events, revenue, session time, bounce rate" },
  "events-chart": { name: "Events Over Time", description: "Time series line/area chart of daily events (page views, signups, purchases, sessions) over 30 days" },
  "funnel-chart": { name: "Conversion Funnel", description: "Funnel visualization from page visit → sign up → verify → onboarding → purchase → subscription with conversion rates" },
  "segments-panel": { name: "User Segments", description: "User segment breakdown (Power, Active, Casual, At Risk, Dormant) with counts and growth indicators" },
  "retention-table": { name: "Retention Cohorts", description: "Cohort retention table showing Day 0/1/3/7/14/30 retention percentages with color-coded heatmap" },
  "live-feed": { name: "Live Event Feed", description: "Real-time scrolling feed of recent events with user ID, event type, details, and location" },
  "top-events": { name: "Top Events", description: "Ranked list of most frequent event types with counts and trend indicators" },
  "revenue-chart": { name: "Revenue Analytics", description: "Revenue over time chart with breakdown by source or plan tier" },
};

const NAV = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "events", label: "Events", icon: "⚡" },
  { id: "funnels", label: "Funnels", icon: "🔽" },
  { id: "retention", label: "Retention", icon: "🔄" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "live", label: "Live View", icon: "🔴" },
];

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-[#1a1c23] rounded-xl border border-[#2a2d35] p-5">
      <p className="text-xs font-medium text-[#8e929b] uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#8e929b] mt-1">{sub}</p>}
    </div>
  );
}

function MiniBarChart({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  const max = Math.max(...data.map(d => d[dataKey]));
  return (
    <div className="flex items-end gap-[2px] h-16">
      {data.slice(-14).map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all hover:opacity-80"
          style={{ height: `${(d[dataKey] / max) * 100}%`, background: color }}
          title={`${d.date}: ${formatNum(d[dataKey])}`}
        />
      ))}
    </div>
  );
}

function FunnelViz() {
  return (
    <div className="space-y-2">
      {FUNNEL_STEPS.map((step, i) => {
        const width = Math.max(step.rate, 15);
        return (
          <div key={step.step} className="flex items-center gap-3">
            <div className="w-36 text-sm text-[#e4e5e7] truncate">{step.step}</div>
            <div className="flex-1 h-9 bg-[#252830] rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg flex items-center px-3 transition-all"
                style={{
                  width: `${width}%`,
                  background: `linear-gradient(90deg, #7c5cfc ${Math.max(0, 100 - i * 20)}%, #5a3fdb)`,
                }}
              >
                <span className="text-xs font-bold text-white whitespace-nowrap">{formatNum(step.count)}</span>
              </div>
            </div>
            <div className="w-14 text-right">
              {i > 0 && <span className="text-xs text-[#8e929b]">{step.rate}%</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RetentionTable() {
  const cols = ["day0", "day1", "day3", "day7", "day14", "day30"] as const;
  const getColor = (val: number | null) => {
    if (val === null) return "bg-[#252830] text-[#8e929b]";
    if (val >= 60) return "bg-[#7c5cfc]/30 text-[#b8a5ff]";
    if (val >= 40) return "bg-[#7c5cfc]/20 text-[#9d85fc]";
    if (val >= 25) return "bg-[#7c5cfc]/10 text-[#8e929b]";
    return "bg-[#252830] text-[#8e929b]";
  };
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-[#8e929b]">
            <th className="text-left pb-2 pr-4">Cohort</th>
            {cols.map(c => <th key={c} className="pb-2 px-2 text-center">{c.replace("day", "D")}</th>)}
          </tr>
        </thead>
        <tbody>
          {RETENTION_COHORTS.map(row => (
            <tr key={row.cohort}>
              <td className="py-1 pr-4 text-[#e4e5e7] font-medium">{row.cohort}</td>
              {cols.map(c => (
                <td key={c} className="py-1 px-1">
                  <div className={`rounded-md text-center py-1.5 text-xs font-medium ${getColor(row[c])}`}>
                    {row[c] !== null ? `${row[c]}%` : "—"}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiveFeed() {
  const eventColors: Record<string, string> = {
    purchase_complete: "text-green-400 bg-green-400/10",
    page_view: "text-blue-400 bg-blue-400/10",
    sign_up: "text-purple-400 bg-purple-400/10",
    button_click: "text-amber-400 bg-amber-400/10",
    search_query: "text-cyan-400 bg-cyan-400/10",
    video_play: "text-pink-400 bg-pink-400/10",
    form_submit: "text-orange-400 bg-orange-400/10",
    file_download: "text-teal-400 bg-teal-400/10",
  };
  return (
    <div className="space-y-1.5">
      {LIVE_EVENTS.map(ev => (
        <div key={ev.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#252830] transition-colors">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${eventColors[ev.event] || "text-[#8e929b] bg-[#252830]"}`}>
            {ev.event}
          </span>
          <span className="text-xs text-[#8e929b] font-mono">{ev.user}</span>
          <span className="flex-1 text-xs text-[#e4e5e7] truncate">
            {(ev as any).amount || (ev as any).page || (ev as any).method || (ev as any).target || (ev as any).query || (ev as any).title || (ev as any).form || (ev as any).file || ""}
          </span>
          <span className="text-[10px] text-[#8e929b]">{ev.location}</span>
          <span className="text-[10px] text-[#8e929b]">{ev.time}</span>
        </div>
      ))}
    </div>
  );
}

function DynamicSlots() {
  const { dynamicSlotIds, slots } = useOnClaw();
  if (dynamicSlotIds.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {dynamicSlotIds.map((id) => (
        <Slot key={id} id={id} className="w-full">
          <div className="bg-[#1a1c23] rounded-xl border border-dashed border-[#2a2d35] p-8 text-center">
            <p className="text-sm text-[#8e929b]">{slots[id]?.name ?? id} — ⌘K to generate</p>
          </div>
        </Slot>
      ))}
    </div>
  );
}

export default function MixpanelClone() {
  const [activeTab, setActiveTab] = useState("overview");

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
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-[#2a2d35] bg-[#111317] flex flex-col">
          <div className="p-4 border-b border-[#2a2d35]">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-[#7c5cfc]">Insight</span>Flow
            </h1>
            <p className="text-[10px] text-[#8e929b] mt-0.5">Product Analytics</p>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  activeTab === item.id
                    ? "bg-[#7c5cfc]/10 text-[#7c5cfc] font-medium"
                    : "text-[#8e929b] hover:text-[#e4e5e7] hover:bg-[#1a1c23]"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-[#2a2d35]">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#7c5cfc]/20 flex items-center justify-center text-xs font-medium text-[#7c5cfc]">ZA</div>
              <div>
                <div className="text-xs font-medium">Zohaib Ahmed</div>
                <div className="text-[10px] text-[#8e929b]">Admin</div>
              </div>
            </div>
            <div className="mt-2 px-2">
              <kbd className="text-[10px] text-[#8e929b] border border-[#2a2d35] rounded px-1.5 py-0.5">⌘K</kbd>
              <span className="text-[10px] text-[#8e929b] ml-1.5">to customize</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {NAV.find(n => n.id === activeTab)?.icon} {NAV.find(n => n.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-[#8e929b] mt-1">Last 30 days • All users</p>
          </div>

          {/* Metrics */}
          <Slot id="dashboard-metrics">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <MetricCard label="Total Users" value={formatNum(METRICS.totalUsers)} color="text-[#7c5cfc]" />
              <MetricCard label="Active Today" value={formatNum(METRICS.activeToday)} sub="↑ 12.3%" color="text-green-400" />
              <MetricCard label="Events Today" value={formatNum(METRICS.eventsToday)} sub="↑ 8.2%" color="text-blue-400" />
              <MetricCard label="Revenue" value={formatMoney(METRICS.revenue)} sub="↑ 15.7%" color="text-emerald-400" />
              <MetricCard label="Avg Session" value={METRICS.avgSessionTime} color="text-amber-400" />
              <MetricCard label="Bounce Rate" value={`${METRICS.bounceRate}%`} sub="↓ 2.1%" color="text-red-400" />
            </div>
          </Slot>

          <div className="grid grid-cols-3 gap-4">
            {/* Events Chart */}
            <div className="col-span-2">
              <Slot id="events-chart">
                <div className="bg-[#1a1c23] rounded-xl border border-[#2a2d35] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Events Over Time</h3>
                    <div className="flex gap-2">
                      {[
                        { key: "pageViews", label: "Page Views", color: "#7c5cfc" },
                        { key: "signups", label: "Signups", color: "#36b37e" },
                        { key: "purchases", label: "Purchases", color: "#ff5630" },
                      ].map(s => (
                        <span key={s.key} className="flex items-center gap-1 text-[10px] text-[#8e929b]">
                          <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <MiniBarChart data={DAILY_EVENTS} dataKey="pageViews" color="#7c5cfc" />
                    <MiniBarChart data={DAILY_EVENTS} dataKey="signups" color="#36b37e" />
                    <MiniBarChart data={DAILY_EVENTS} dataKey="purchases" color="#ff5630" />
                  </div>
                </div>
              </Slot>
            </div>

            {/* Top Events */}
            <Slot id="top-events">
              <div className="bg-[#1a1c23] rounded-xl border border-[#2a2d35] p-5">
                <h3 className="text-sm font-semibold mb-4">Top Events</h3>
                <div className="space-y-2.5">
                  {TOP_EVENTS.slice(0, 6).map((ev, i) => (
                    <div key={ev.name} className="flex items-center gap-2">
                      <span className="w-5 text-xs text-[#8e929b] text-right">{i + 1}</span>
                      <span className="flex-1 text-sm font-mono text-[#e4e5e7] truncate">{ev.name}</span>
                      <span className="text-sm font-medium">{formatNum(ev.count)}</span>
                      <span className={`text-xs ${ev.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {ev.change >= 0 ? "↑" : "↓"}{Math.abs(ev.change)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Slot>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Funnel */}
            <Slot id="funnel-chart">
              <div className="bg-[#1a1c23] rounded-xl border border-[#2a2d35] p-5">
                <h3 className="text-sm font-semibold mb-4">Conversion Funnel</h3>
                <FunnelViz />
              </div>
            </Slot>

            {/* Segments */}
            <Slot id="segments-panel">
              <div className="bg-[#1a1c23] rounded-xl border border-[#2a2d35] p-5">
                <h3 className="text-sm font-semibold mb-4">User Segments</h3>
                <div className="space-y-3">
                  {USER_SEGMENTS.map(seg => (
                    <div key={seg.name} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                      <span className="flex-1 text-sm">{seg.name}</span>
                      <span className="text-sm font-medium">{formatNum(seg.count)}</span>
                      <span className={`text-xs ${seg.growth >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {seg.growth >= 0 ? "↑" : "↓"}{Math.abs(seg.growth)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Slot>
          </div>

          {/* Retention */}
          <Slot id="retention-table">
            <div className="bg-[#1a1c23] rounded-xl border border-[#2a2d35] p-5">
              <h3 className="text-sm font-semibold mb-4">Retention Cohorts</h3>
              <RetentionTable />
            </div>
          </Slot>

          {/* Live Feed */}
          <Slot id="live-feed">
            <div className="bg-[#1a1c23] rounded-xl border border-[#2a2d35] p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-sm font-semibold">Live Event Feed</h3>
                <span className="text-xs text-[#8e929b]">— Real-time</span>
              </div>
              <LiveFeed />
            </div>
          </Slot>

          <DynamicSlots />
        </main>
      </div>
    </OnClawProvider>
  );
}
