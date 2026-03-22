"use client";

import { Shell, Slot } from "@/components/shell";
import { formatNumber, timeAgo, EVENT_COLORS } from "@/lib/format";
import { useEffect, useState } from "react";

const CATEGORY_ICONS: Record<string, string> = {
  pageview: "👁", click: "👆", signup: "✨", purchase: "💳", custom: "⚙️", api_call: "🔌", error: "❌",
};

export default function LivePage() {
  const [data, setData] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    fetch("/api/data?q=live").then((r) => r.json()).then(setData);
  }, [refreshCount]);

  // Auto-refresh every 5s
  useEffect(() => {
    const interval = setInterval(() => setRefreshCount((c) => c + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-slate-500">Loading...</div></Shell>;

  const { events, perMinute } = data;

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Live View</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time event stream</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Live Stats */}
        <Slot id="live-stats">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Events (Last 50)</p>
              <p className="text-2xl font-bold text-violet-400 mt-1">{events.length}</p>
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Unique Users (Recent)</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {new Set(events.map((e: any) => e.distinct_id)).size}
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Top Event (Recent)</p>
              <p className="text-2xl font-bold text-amber-400 mt-1 truncate">
                {(() => {
                  const counts: Record<string, number> = {};
                  events.forEach((e: any) => { counts[e.name] = (counts[e.name] || 0) + 1; });
                  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
                })()}
              </p>
            </div>
          </div>
        </Slot>

        {/* Event Feed */}
        <Slot id="live-feed">
          <div className="bg-slate-900 rounded-xl border border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Event Stream</h3>
              <button
                onClick={() => setRefreshCount((c) => c + 1)}
                className="text-xs text-violet-400 hover:text-violet-300 transition"
              >
                Refresh
              </button>
            </div>
            <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-auto">
              {events.map((ev: any, i: number) => (
                <div key={`${ev.id}-${i}`} className="px-4 py-3 hover:bg-slate-800/30 transition flex items-center gap-4">
                  <span className="text-lg" title={ev.category}>
                    {CATEGORY_ICONS[ev.category] || "⚙️"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ev.name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${EVENT_COLORS[ev.category]}20`, color: EVENT_COLORS[ev.category] }}
                      >
                        {ev.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-slate-500">{ev.user_name || ev.distinct_id.slice(0, 12)}</span>
                      {ev.city && <span className="text-[10px] text-slate-600">📍 {ev.city}, {ev.country}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 whitespace-nowrap">{timeAgo(ev.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </Slot>
      </div>
    </Shell>
  );
}
