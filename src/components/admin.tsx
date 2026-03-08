"use client";

import React, { useMemo } from "react";
import { useOnClaw } from "./provider";
import type { OnClawAnalytics } from "../types";

/**
 * Built-in admin analytics panel.
 * Shows generation stats, popular slots, recent prompts.
 *
 * Usage: <OnClawAdmin />
 * Must be inside a <OnClawProvider>.
 */
export function OnClawAdmin({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) {
  const { components, slots, config } = useOnClaw();

  const analytics = useMemo<OnClawAnalytics>(() => {
    const perSlot: Record<string, number> = {};
    const recentPrompts: { prompt: string; slotId: string; timestamp: number }[] = [];

    for (const comp of components) {
      perSlot[comp.slotId] = (perSlot[comp.slotId] ?? 0) + 1 + comp.history.length;
      recentPrompts.push({
        prompt: comp.prompt,
        slotId: comp.slotId,
        timestamp: comp.updatedAt,
      });
      for (const h of comp.history) {
        recentPrompts.push({
          prompt: h.prompt,
          slotId: comp.slotId,
          timestamp: h.timestamp,
        });
      }
    }

    recentPrompts.sort((a, b) => b.timestamp - a.timestamp);

    const totalGenerations = recentPrompts.length;

    return {
      totalGenerations,
      perSlot,
      recentPrompts: recentPrompts.slice(0, 10),
      errors: 0,
      avgDurationMs: 0,
      templateUsage: recentPrompts.filter((p) => p.prompt.startsWith("Template:")).length,
    };
  }, [components]);

  const slotEntries = Object.entries(slots);

  return (
    <div
      className={className}
      style={{
        padding: "24px",
        borderRadius: "var(--ck-radius)",
        border: "1px solid var(--ck-border)",
        background: "var(--ck-bg)",
        fontFamily: "var(--ck-font)",
        color: "var(--ck-text)",
        ...style,
      }}
    >
      <h2
        style={{
          margin: "0 0 20px",
          fontSize: "18px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-8 4 4 4-12" />
        </svg>
        OnClaw Analytics
      </h2>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <StatCard label="Total Generations" value={analytics.totalGenerations} />
        <StatCard label="Active Slots" value={Object.keys(analytics.perSlot).length} total={slotEntries.length} />
        <StatCard label="Templates Used" value={analytics.templateUsage} />
        <StatCard label="User" value={config.userId} isText />
      </div>

      {/* Per-slot breakdown */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Slot Usage
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {slotEntries.map(([id, cfg]) => {
            const count = analytics.perSlot[id] ?? 0;
            const max = Math.max(...Object.values(analytics.perSlot), 1);
            return (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "100px", fontSize: "12px", color: "var(--ck-text-muted)", flexShrink: 0 }}>
                  {cfg.name}
                </div>
                <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "var(--ck-bg-secondary)", overflow: "hidden" }}>
                  <div style={{
                    width: `${(count / max) * 100}%`,
                    height: "100%",
                    borderRadius: "3px",
                    background: count > 0 ? "var(--ck-accent)" : "transparent",
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <span style={{ width: "30px", fontSize: "12px", textAlign: "right", color: "var(--ck-text-muted)" }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent prompts */}
      {analytics.recentPrompts.length > 0 && (
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Recent Prompts
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {analytics.recentPrompts.slice(0, 8).map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 10px", borderRadius: "6px",
                background: "var(--ck-bg-secondary)", fontSize: "12px",
              }}>
                <span style={{
                  padding: "1px 6px", borderRadius: "3px", fontSize: "10px",
                  background: "var(--ck-bg-hover)", color: "var(--ck-text-muted)", flexShrink: 0,
                }}>
                  {slots[p.slotId]?.name ?? p.slotId}
                </span>
                <span style={{ color: "var(--ck-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.prompt}
                </span>
                <span style={{ fontSize: "10px", color: "var(--ck-text-muted)", marginLeft: "auto", flexShrink: 0 }}>
                  {formatRelativeTime(p.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, total, isText }: {
  label: string;
  value: number | string;
  total?: number;
  isText?: boolean;
}) {
  return (
    <div style={{
      padding: "14px", borderRadius: "8px",
      background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
    }}>
      <div style={{ fontSize: "10px", color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{
        fontSize: isText ? "13px" : "24px",
        fontWeight: isText ? 500 : 700,
        color: "var(--ck-text)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
        {total !== undefined && (
          <span style={{ fontSize: "13px", color: "var(--ck-text-muted)", fontWeight: 400 }}>
            {" / "}{total}
          </span>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}
