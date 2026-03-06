"use client";

import React, { useState, useCallback } from "react";

interface StyleOverride {
  key: string;
  label: string;
  type: "color" | "size" | "select";
  options?: string[];
  cssVar: string;
}

const STYLE_PRESETS: StyleOverride[] = [
  { key: "accent", label: "Accent Color", type: "color", cssVar: "--ck-accent" },
  { key: "bg", label: "Background", type: "color", cssVar: "--ck-bg" },
  { key: "text", label: "Text Color", type: "color", cssVar: "--ck-text" },
  { key: "radius", label: "Roundness", type: "select", options: ["0px", "4px", "8px", "12px", "16px", "999px"], cssVar: "--ck-radius" },
  { key: "font", label: "Font", type: "select", options: [
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    '"Inter", sans-serif',
    '"JetBrains Mono", monospace',
    'Georgia, "Times New Roman", serif',
  ], cssVar: "--ck-font" },
];

const COLOR_PRESETS = [
  { name: "Default", accent: "hsl(0 0% 98%)", bg: "hsl(0 0% 3.9%)" },
  { name: "Blue", accent: "hsl(217 91% 60%)", bg: "hsl(222 47% 11%)" },
  { name: "Purple", accent: "hsl(262 83% 58%)", bg: "hsl(263 70% 8%)" },
  { name: "Green", accent: "hsl(142 71% 45%)", bg: "hsl(144 61% 6%)" },
  { name: "Orange", accent: "hsl(25 95% 53%)", bg: "hsl(20 50% 7%)" },
  { name: "Rose", accent: "hsl(346 77% 50%)", bg: "hsl(345 50% 7%)" },
];

export function StyleEditor({
  onApply,
  currentOverrides,
}: {
  onApply: (overrides: Record<string, string>) => void;
  currentOverrides?: Record<string, string>;
}) {
  const [overrides, setOverrides] = useState<Record<string, string>>(
    currentOverrides ?? {}
  );
  const [expanded, setExpanded] = useState(false);

  const updateOverride = useCallback((cssVar: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [cssVar]: value }));
  }, []);

  const applyPreset = useCallback((preset: typeof COLOR_PRESETS[0]) => {
    const next = {
      ...overrides,
      "--ck-accent": preset.accent,
      "--ck-bg": preset.bg,
    };
    setOverrides(next);
    onApply(next);
  }, [overrides, onApply]);

  return (
    <div style={{ padding: "12px", fontFamily: "var(--ck-font)" }}>
      {/* Color Presets */}
      <div style={{
        fontSize: "10px", fontWeight: 600, color: "var(--ck-text-muted)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px",
      }}>
        Quick Theme
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "4px 10px", borderRadius: "6px",
              border: "1px solid var(--ck-border)", background: "var(--ck-bg-secondary)",
              cursor: "pointer", fontFamily: "var(--ck-font)", fontSize: "11px",
              color: "var(--ck-text)", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ck-accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ck-border)")}
          >
            <div style={{
              width: "12px", height: "12px", borderRadius: "50%",
              background: preset.accent, border: "1px solid rgba(255,255,255,0.1)",
            }} />
            {preset.name}
          </button>
        ))}
      </div>

      {/* Expand/collapse advanced */}
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--ck-text-muted)", fontSize: "11px",
          fontFamily: "var(--ck-font)", padding: "4px 0",
          display: "flex", alignItems: "center", gap: "4px",
        }}
      >
        {expanded ? "▾" : "▸"} Advanced
      </button>

      {expanded && (
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {STYLE_PRESETS.map((style) => (
            <div key={style.key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{
                fontSize: "12px", color: "var(--ck-text-muted)", width: "100px", flexShrink: 0,
              }}>
                {style.label}
              </label>
              {style.type === "color" ? (
                <input
                  type="color"
                  value={overrides[style.cssVar] ?? "#ffffff"}
                  onChange={(e) => updateOverride(style.cssVar, e.target.value)}
                  style={{ width: "32px", height: "24px", border: "none", borderRadius: "4px", cursor: "pointer", padding: 0 }}
                />
              ) : style.type === "select" ? (
                <select
                  value={overrides[style.cssVar] ?? ""}
                  onChange={(e) => updateOverride(style.cssVar, e.target.value)}
                  style={{
                    flex: 1, padding: "4px 8px", borderRadius: "4px",
                    background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                    color: "var(--ck-text)", fontSize: "11px", fontFamily: "var(--ck-font)",
                  }}
                >
                  <option value="">Default</option>
                  {style.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.length > 30 ? opt.split(",")[0].replace(/"/g, "") : opt}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}

          <button
            onClick={() => onApply(overrides)}
            style={{
              marginTop: "4px", padding: "8px 16px", borderRadius: "var(--ck-radius)",
              background: "var(--ck-accent)", color: "var(--ck-accent-text)",
              border: "none", fontSize: "12px", fontWeight: 500,
              cursor: "pointer", fontFamily: "var(--ck-font)", alignSelf: "flex-start",
            }}
          >
            Apply Styles
          </button>
        </div>
      )}
    </div>
  );
}
