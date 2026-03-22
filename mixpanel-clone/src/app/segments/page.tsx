"use client";

import { Shell, Slot } from "@/components/shell";
import { BreakdownPieChart } from "@/components/charts";
import { formatNumber } from "@/lib/format";
import { useEffect, useState } from "react";

export default function SegmentsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/data?q=segments").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-slate-500">Loading...</div></Shell>;

  const { segments, byPlan, byCountry, byOS, byBrowser } = data;

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Segments</h2>
          <p className="text-sm text-slate-500 mt-1">Analyze and target user cohorts</p>
        </div>

        <Slot id="segments-overview">
          <div className="grid grid-cols-3 gap-4">
            {segments.map((seg: any) => {
              const filters = typeof seg.filters === "string" ? JSON.parse(seg.filters) : seg.filters;
              return (
                <div key={seg.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-violet-500/30 transition">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{seg.name}</h3>
                    <span className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full font-medium">
                      {formatNumber(seg.userCount)} users
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(filters).map(([key, val]) => (
                      <span key={key} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        {key}: {Array.isArray(val) ? (val as string[]).join(", ") : String(val)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Slot>

        <Slot id="segments-breakdown">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Users by Plan</h3>
              <BreakdownPieChart data={byPlan} />
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Users by Country</h3>
              <BreakdownPieChart data={byCountry} />
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Users by OS</h3>
              <BreakdownPieChart data={byOS} />
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold mb-4">Users by Browser</h3>
              <BreakdownPieChart data={byBrowser} />
            </div>
          </div>
        </Slot>
      </div>
    </Shell>
  );
}
