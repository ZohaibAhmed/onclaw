"use client";

import { Shell, Slot } from "@/components/shell";
import { RetentionLineChart } from "@/components/charts";
import { useEffect, useState } from "react";

export default function RetentionPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/data?q=retention").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-slate-500">Loading...</div></Shell>;

  const { cohorts, curve } = data;

  // Build cohort grid
  const cohortMap: Record<string, Record<number, number>> = {};
  const allWeeks = new Set<number>();
  for (const row of cohorts) {
    if (!cohortMap[row.cohort]) cohortMap[row.cohort] = {};
    cohortMap[row.cohort][row.week_number] = row.users;
    allWeeks.add(row.week_number);
  }
  const weeks = [...allWeeks].sort((a, b) => a - b).slice(0, 10);
  const cohortKeys = Object.keys(cohortMap).sort().slice(-8);

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Retention</h2>
          <p className="text-sm text-slate-500 mt-1">User retention cohort analysis</p>
        </div>

        {/* Retention Curve */}
        <Slot id="retention-curve">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <h3 className="text-sm font-semibold mb-4">Average Retention Curve</h3>
            <RetentionLineChart data={curve} />
          </div>
        </Slot>

        {/* Cohort Heatmap */}
        <Slot id="retention-chart">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold mb-4">Cohort Retention Heatmap</h3>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-slate-500 font-medium">Cohort</th>
                  {weeks.map((w) => (
                    <th key={w} className="p-2 text-slate-500 font-medium text-center">W{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortKeys.map((cohort) => {
                  const base = cohortMap[cohort]?.[0] || 1;
                  return (
                    <tr key={cohort}>
                      <td className="p-2 text-slate-400 whitespace-nowrap">{cohort}</td>
                      {weeks.map((w) => {
                        const users = cohortMap[cohort]?.[w];
                        const pct = users != null ? Math.round((users / base) * 100) : null;
                        const intensity = pct != null ? Math.min(pct / 100, 1) : 0;
                        return (
                          <td key={w} className="p-2 text-center">
                            {pct != null ? (
                              <div
                                className="rounded px-2 py-1 text-[10px] font-medium"
                                style={{
                                  background: `rgba(34, 197, 94, ${intensity * 0.4})`,
                                  color: intensity > 0.3 ? "#22c55e" : "#64748b",
                                }}
                              >
                                {pct}%
                              </div>
                            ) : (
                              <span className="text-slate-700">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Slot>
      </div>
    </Shell>
  );
}
