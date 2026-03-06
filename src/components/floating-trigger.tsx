"use client";

import React, { useState } from "react";
import { useClawKit } from "./provider";

export function FloatingTrigger() {
  const { open, isOpen } = useClawKit();
  const [hovered, setHovered] = useState(false);

  if (isOpen) return null;

  return (
    <button
      onClick={() => open()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Open ClawKit"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        background: hovered ? "var(--ck-bg-hover)" : "var(--ck-bg)",
        border: "1px solid var(--ck-border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        color: "var(--ck-text)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        transform: hovered ? "scale(1.05)" : "scale(1)",
        zIndex: 99990,
        fontFamily: "var(--ck-font)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
        <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
      </svg>
    </button>
  );
}
