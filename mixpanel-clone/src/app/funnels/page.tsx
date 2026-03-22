"use client";

import { Shell, Slot } from "@/components/shell";
import { formatNumber } from "@/lib/format";
import { useEffect, useState } from "react";

export default function FunnelsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/data?q=funnels").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-slate-500">Loading...</div></Shell>;

  const { funnels } = data;

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Funnels</h2>
          <p className="text-sm text-slate-500 mt-1">Analyze conversion flows</p>
        </div>

        <Slot id="funnel-list">
          <div className="grid gap-6">
            {funnels.map((funnel: any) => (
              <div key={funnel.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold mb-1">{funnel.name}</h3>
                <p className="text-xs text-slate-500 mb-6">
                  {funnel.stepData.length} steps · Overall: {funnel.stepData.length > 0 ? Math.round((funnel.stepData[funnel.stepData.length - 1].users / Math.max(funnel.stepData[0].users, 1)) * 100) : 0}% conversion
                </p>

                <Slot id="funnel-chart">
                  <div className="flex items-end gap-2">
                    {funnel.stepData.map((step: any, i: number) => {
                      const maxUsers = funnel.stepData[0]?.users || 1;
                      const heightPct = Math.max((step.users / maxUsers) * 100, 8);
                      const dropoff = i > 0 ? funnel.stepData[i - 1].users - step.users : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex flex-col items-center mb-2" style={{ height: 200 }}>
                            <div className="w-full flex items-end justify-center" style={{ height: "100%" }}>
                              <div
                                className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 relative group"
                                style={{ height: `${heightPct}%` }}
                              >
                                <div className="absolute -top-6 left-0 right-0 text-center">
                                  <span className="text-sm font-bold text-white">{formatNumber(step.users)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center mt-1">
                            <p className="text-xs font-medium text-slate-300 truncate max-w-[100px]">{step.step}</p>
                            {i > 0 && (
                              <div className="mt-1">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  step.rate >= 50 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                }`}>
                                  {step.rate}%
                                </span>
                                <p className="text-[10px] text-slate-600 mt-0.5">-{formatNumber(dropoff)} dropped</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Slot>

                {/* Arrow connectors */}
                <div className="flex items-center mt-4 px-4">
                  {funnel.stepData.slice(0, -1).map((_: any, i: number) => (
                    <div key={i} className="flex-1 flex items-center">
                      <div className="flex-1 h-px bg-slate-700" />
                      <span className="text-slate-600 text-xs px-1">→</span>
                      <div className="flex-1 h-px bg-slate-700" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Slot>
      </div>
    </Shell>
  );
}
