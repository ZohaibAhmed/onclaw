"use client";

import { Shell, Slot, useClawKit } from "@/components/shell";
import { formatCurrency, formatNumber, timeAgo, STAGE_COLORS } from "@/lib/format";
import { useEffect, useState } from "react";

function DynamicSlots() {
  const { dynamicSlotIds, slots } = useClawKit();
  if (dynamicSlotIds.length === 0) return null;
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {dynamicSlotIds.map((id) => (
        <Slot key={id} id={id} className="w-full">
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-slate-500">
              {slots[id]?.name ?? id} — Hit ⌘K to generate
            </p>
          </div>
        </Slot>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/data?q=dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-slate-500">Loading...</div></Shell>;

  const { metrics, pipeline, recentActivity, leaderboard, monthlyDeals } = data;

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Sales performance overview</p>
        </div>

        {/* Metrics Cards */}
        <Slot id="dashboard-metrics">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Pipeline", value: formatCurrency(metrics.totalPipeline), sub: `${formatNumber(metrics.totalDeals)} deals`, color: "text-indigo-400" },
              { label: "Won Revenue", value: formatCurrency(metrics.wonRevenue), sub: "closed-won total", color: "text-emerald-400" },
              { label: "Win Rate", value: `${metrics.winRate}%`, sub: "won / (won + lost)", color: "text-amber-400" },
              { label: "Avg Deal Size", value: formatCurrency(metrics.avgDealSize), sub: "across all deals", color: "text-purple-400" },
            ].map((m) => (
              <div key={m.label} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{m.label}</p>
                <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                <p className="text-xs text-slate-600 mt-1">{m.sub}</p>
              </div>
            ))}
          </div>
        </Slot>

        <div className="grid grid-cols-3 gap-6">
          {/* Pipeline by Stage */}
          <div className="col-span-2">
            <Slot id="dashboard-pipeline">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h3 className="text-sm font-semibold mb-4">Pipeline by Stage</h3>
                <div className="space-y-3">
                  {pipeline.map((s: any) => {
                    const maxVal = Math.max(...pipeline.map((p: any) => Number(p.total || 0)));
                    const pct = maxVal > 0 ? (Number(s.total || 0) / maxVal) * 100 : 0;
                    return (
                      <div key={s.stage} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-slate-400 capitalize">{s.stage.replace("-", " ")}</div>
                        <div className="flex-1 h-7 bg-slate-800 rounded-md overflow-hidden">
                          <div
                            className="h-full rounded-md flex items-center px-2 text-xs font-medium text-white"
                            style={{ width: `${Math.max(pct, 8)}%`, background: STAGE_COLORS[s.stage] || "#6366f1" }}
                          >
                            {formatCurrency(Number(s.total || 0))}
                          </div>
                        </div>
                        <div className="w-8 text-xs text-slate-500 text-right">{s.count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Slot>
          </div>

          {/* Leaderboard */}
          <Slot id="dashboard-leaderboard">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Top Performers</h3>
              <div className="space-y-3">
                {leaderboard.slice(0, 6).map((rep: any, i: number) => (
                  <div key={rep.name} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-slate-400/20 text-slate-300" : "bg-slate-700 text-slate-400"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-medium text-indigo-400">
                      {rep.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rep.name}</p>
                      <p className="text-xs text-slate-500">{rep.wonCount} deals won</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(Number(rep.wonValue))}</p>
                  </div>
                ))}
              </div>
            </div>
          </Slot>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Monthly Trend */}
          <div className="col-span-2">
            <Slot id="dashboard-monthly">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h3 className="text-sm font-semibold mb-4">Won vs Lost by Month</h3>
                <div className="flex items-end gap-1 h-40">
                  {(() => {
                    const months = [...new Set((monthlyDeals as any[]).map((d) => d.month))].sort();
                    const maxVal = Math.max(...(monthlyDeals as any[]).map((d) => Number(d.total_value || 0)));
                    return months.map((month) => {
                      const won = (monthlyDeals as any[]).find((d) => d.month === month && d.stage === "closed-won");
                      const lost = (monthlyDeals as any[]).find((d) => d.month === month && d.stage === "closed-lost");
                      const wonH = maxVal > 0 ? (Number(won?.total_value || 0) / maxVal) * 100 : 0;
                      const lostH = maxVal > 0 ? (Number(lost?.total_value || 0) / maxVal) * 100 : 0;
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                            <div className="flex-1 rounded-t bg-emerald-500/80" style={{ height: `${wonH}%` }} title={`Won: ${formatCurrency(Number(won?.total_value || 0))}`} />
                            <div className="flex-1 rounded-t bg-red-500/60" style={{ height: `${lostH}%` }} title={`Lost: ${formatCurrency(Number(lost?.total_value || 0))}`} />
                          </div>
                          <span className="text-[9px] text-slate-600">{month.slice(5)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />Won</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/60" />Lost</span>
                </div>
              </div>
            </Slot>
          </div>

          {/* Recent Activity */}
          <Slot id="dashboard-activity">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-2.5 max-h-48 overflow-auto">
                {recentActivity.slice(0, 10).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5">
                      {a.type === "call" ? "📞" : a.type === "email" ? "✉️" : a.type === "meeting" ? "🤝" : a.type === "note" ? "📝" : "✅"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.subject}</p>
                      <p className="text-[10px] text-slate-600">{a.ownerName} · {timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Slot>
        </div>
      </div>
      <DynamicSlots />
    </Shell>
  );
}
