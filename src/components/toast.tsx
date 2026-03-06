"use client";

import React from "react";
import { useClawKit } from "./provider";

const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const COLORS = {
  success: { bg: "hsl(142 71% 10%)", border: "hsl(142 71% 25%)", text: "hsl(142 71% 65%)" },
  error: { bg: "hsl(0 62% 10%)", border: "hsl(0 62% 25%)", text: "hsl(0 62% 65%)" },
  info: { bg: "var(--ck-bg-secondary)", border: "var(--ck-border)", text: "var(--ck-text-muted)" },
};

export function Toast() {
  const { toasts, dismissToast } = useClawKit();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99997,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => {
        const colors = COLORS[toast.type];
        return (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            style={{
              pointerEvents: "auto",
              padding: "10px 16px",
              borderRadius: "var(--ck-radius)",
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: "13px",
              fontFamily: "var(--ck-font)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              animation: "ck-toast-in 0.3s ease-out",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "14px" }}>
              {ICONS[toast.type]}
            </span>
            {toast.message}
          </div>
        );
      })}
      <style>
        {`
          @keyframes ck-toast-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
