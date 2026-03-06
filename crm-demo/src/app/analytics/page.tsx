"use client";

import { Shell, Slot } from "@/components/shell";
import { formatCurrency, STAGE_COLORS } from "@/lib/format";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data?q=analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-slate-500">Loading...</div></Shell>;

  const { byMonth, byRep, bySource, velocity } = data;

  // Build monthly revenue data
  const months = [...new Set((byMonth as any[]).map((d) => d.month))].sort();
  const wonByMonth = months.map((m) => {
    const won = (byMonth as any[]).find((d) => d.month === m && d.stage === "closed-won");
    return { month: m, value: Number(won?.total || 0) };
  });
  const maxMonthly = Math.max(...wonByMonth.map((d) => d.value), 1);

  // Rep win rates
  const repNames = [...new Set((byRep as any[]).map((d) => d.name))];
  const repStats = repNames.map((name) => {
    const won = (byRep as any[]).find((d) => d.name === name && d.stage === "closed-won");
    const lost = (byRep as any[]).find((d) => d.name === name && d.stage === "closed-lost");
    const w = Number(won?.cnt || 0);
    const l = Number(lost?.cnt || 0);
    return { name, won: w, lost: l, rate: w + l > 0 ? Math.round((w / (w + l)) * 100) : 0, revenue: Number(won?.total || 0) };
  }).sort((a, b) => b.rate - a.rate);

  // Source data
  const maxSourceVal = Math.max(...(bySource as any[]).map((d) => Number(d.total || 0)), 1);

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Deep dive into sales performance</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Revenue by Month */}
          <Slot id="analytics-revenue">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Monthly Revenue (Won)</h3>
              <div className="flex items-end gap-1 h-44">
                {wonByMonth.map((d) => {
                  const h = (d.value / maxMonthly) * 100;
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: "150px" }}>
                        <div
                          className="w-full max-w-[28px] rounded-t bg-indigo-500/80 hover:bg-indigo-400/80 transition"
                          style={{ height: `${Math.max(h, 3)}%` }}
                          title={formatCurrency(d.value)}
                        />
                      </div>
                      <span className="text-[9px] text-slate-600">{d.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Slot>

          {/* Sales Funnel */}
          <Slot id="analytics-funnel">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Pipeline Funnel</h3>
              <div className="space-y-2">
                {["prospecting", "qualification", "proposal", "negotiation", "closed-won"].map((stage, i) => {
                  const stageData = (byMonth as any[]).filter((d) => d.stage === stage);
                  const total = stageData.reduce((s: number, d: any) => s + Number(d.cnt || 0), 0);
                  const maxFunnel = (byMonth as any[]).filter((d) => d.stage === "prospecting").reduce((s: number, d: any) => s + Number(d.cnt || 0), 0) || 1;
                  const width = Math.max((total / maxFunnel) * 100, 15);
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-slate-400 capitalize">{stage.replace("-", " ")}</div>
                      <div className="flex-1 flex justify-center">
                        <div
                          className="h-8 rounded-md flex items-center justify-center text-xs font-medium text-white transition-all"
                          style={{ width: `${width}%`, background: STAGE_COLORS[stage] }}
                        >
                          {total}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Slot>

          {/* Win Rate by Rep */}
          <Slot id="analytics-winrate">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Win Rate by Rep</h3>
              <div className="space-y-3">
                {repStats.map((rep) => (
                  <div key={rep.name} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-slate-400 truncate">{rep.name}</div>
                    <div className="flex-1 h-5 bg-slate-800 rounded overflow-hidden flex">
                      <div className="h-full bg-emerald-500/70 rounded-l" style={{ width: `${rep.rate}%` }} />
                      <div className="h-full bg-red-500/40" style={{ width: `${100 - rep.rate}%` }} />
                    </div>
                    <span className="w-10 text-xs font-medium text-right">{rep.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Slot>

          {/* Source Attribution */}
          <Slot id="analytics-source">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Revenue by Lead Source</h3>
              <div className="space-y-3">
                {(bySource as any[]).map((s, i) => {
                  const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f59e0b", "#22c55e"];
                  const pct = (Number(s.total || 0) / maxSourceVal) * 100;
                  return (
                    <div key={s.source} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-slate-400 capitalize">{s.source}</div>
                      <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                        <div
                          className="h-full rounded flex items-center px-2 text-[10px] font-medium text-white"
                          style={{ width: `${Math.max(pct, 10)}%`, background: colors[i % colors.length] }}
                        >
                          {formatCurrency(Number(s.total || 0))}
                        </div>
                      </div>
                      <span className="w-6 text-xs text-slate-500 text-right">{s.cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Slot>
        </div>

        {/* Deal Velocity */}
        <Slot id="analytics-velocity">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <h3 className="text-sm font-semibold mb-4">Average Days to Close</h3>
            <div className="flex items-end gap-1 h-32">
              {(velocity as any[]).map((v) => {
                const maxDays = Math.max(...(velocity as any[]).map((x) => Number(x.avg_days || 0)), 1);
                const h = (Number(v.avg_days || 0) / maxDays) * 100;
                return (
                  <div key={v.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                      <div
                        className="w-full max-w-[24px] rounded-t bg-amber-500/70"
                        style={{ height: `${Math.max(h, 5)}%` }}
                        title={`${v.avg_days} days`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-600">{v.month?.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Slot>
      </div>
    </Shell>
  );
}
