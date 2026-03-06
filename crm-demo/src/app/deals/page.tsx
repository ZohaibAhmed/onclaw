"use client";

import { Shell, Slot } from "@/components/shell";
import { formatCurrency, STAGE_COLORS } from "@/lib/format";
import { useEffect, useState } from "react";

const STAGES = ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"];

export default function DealsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data?q=deals").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-slate-500">Loading...</div></Shell>;

  const byStage = STAGES.map((stage) => ({
    stage,
    deals: data.deals.filter((d: any) => d.stage === stage),
    total: data.deals.filter((d: any) => d.stage === stage).reduce((s: number, d: any) => s + Number(d.value), 0),
  }));

  return (
    <Shell>
      <div className="p-6 space-y-6 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Deals</h2>
            <p className="text-sm text-slate-500 mt-1">{data.deals.length} total deals</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg transition">
            + New Deal
          </button>
        </div>

        <Slot id="deals-header">
          <div className="flex gap-3">
            {byStage.map((col) => (
              <div key={col.stage} className="flex-1 bg-slate-900 rounded-lg border border-slate-800 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize" style={{ color: STAGE_COLORS[col.stage] }}>
                    {col.stage.replace("-", " ")}
                  </span>
                  <span className="text-xs text-slate-500">{col.deals.length}</span>
                </div>
                <p className="text-sm font-bold mt-0.5">{formatCurrency(col.total)}</p>
              </div>
            ))}
          </div>
        </Slot>

        {/* Kanban */}
        <div className="flex-1 flex gap-3 overflow-x-auto pb-4 min-h-0">
          {byStage.map((col) => (
            <div key={col.stage} className="w-64 flex-shrink-0 flex flex-col">
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[col.stage] }} />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {col.stage.replace("-", " ")}
                </span>
                <span className="text-[10px] text-slate-600 ml-auto">{col.deals.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-auto">
                {col.deals.slice(0, 15).map((deal: any) => (
                  <div
                    key={deal.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition cursor-pointer"
                  >
                    <p className="text-xs font-medium leading-tight line-clamp-2">{deal.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold" style={{ color: STAGE_COLORS[deal.stage] }}>
                        {formatCurrency(Number(deal.value))}
                      </span>
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] font-medium text-indigo-400">
                        {deal.ownerAvatar}
                      </div>
                    </div>
                    {deal.companyName && (
                      <p className="text-[10px] text-slate-600 mt-1.5 truncate">{deal.companyName}</p>
                    )}
                    {deal.expectedCloseDate && (
                      <p className="text-[10px] text-slate-600 mt-0.5">Close: {deal.expectedCloseDate}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
