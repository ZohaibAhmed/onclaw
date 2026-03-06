"use client";

import React, { useMemo } from "react";

interface DiffLine {
  type: "same" | "add" | "remove";
  content: string;
  lineNum: { old?: number; new?: number };
}

/**
 * Simple line-based diff viewer for generated code.
 * Shows before/after comparison with color-coded lines.
 */
export function DiffView({
  oldCode,
  newCode,
  maxHeight = 250,
}: {
  oldCode: string;
  newCode: string;
  maxHeight?: number;
}) {
  const diff = useMemo(() => computeDiff(oldCode, newCode), [oldCode, newCode]);

  if (diff.length === 0) return null;

  const addCount = diff.filter((d) => d.type === "add").length;
  const removeCount = diff.filter((d) => d.type === "remove").length;

  return (
    <div
      style={{
        borderRadius: "6px",
        border: "1px solid var(--ck-border)",
        overflow: "hidden",
        fontFamily: "monospace",
        fontSize: "11px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          background: "var(--ck-bg-secondary)",
          borderBottom: "1px solid var(--ck-border)",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--ck-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Changes
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ color: "#22c55e", fontSize: "11px" }}>+{addCount}</span>
          <span style={{ color: "#ef4444", fontSize: "11px" }}>-{removeCount}</span>
        </div>
      </div>

      {/* Diff lines */}
      <div style={{ maxHeight, overflowY: "auto", background: "var(--ck-bg)" }}>
        {diff.map((line, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              background:
                line.type === "add"
                  ? "rgba(34, 197, 94, 0.08)"
                  : line.type === "remove"
                    ? "rgba(239, 68, 68, 0.08)"
                    : "transparent",
              borderLeft: `3px solid ${
                line.type === "add"
                  ? "#22c55e"
                  : line.type === "remove"
                    ? "#ef4444"
                    : "transparent"
              }`,
            }}
          >
            {/* Line number gutter */}
            <div
              style={{
                width: "32px",
                flexShrink: 0,
                textAlign: "right",
                padding: "1px 6px 1px 0",
                color: "var(--ck-text-muted)",
                opacity: 0.4,
                userSelect: "none",
                fontSize: "10px",
              }}
            >
              {line.lineNum.old ?? ""}
            </div>
            <div
              style={{
                width: "32px",
                flexShrink: 0,
                textAlign: "right",
                padding: "1px 6px 1px 0",
                color: "var(--ck-text-muted)",
                opacity: 0.4,
                userSelect: "none",
                fontSize: "10px",
              }}
            >
              {line.lineNum.new ?? ""}
            </div>
            {/* Sign */}
            <span
              style={{
                width: "16px",
                flexShrink: 0,
                textAlign: "center",
                color:
                  line.type === "add"
                    ? "#22c55e"
                    : line.type === "remove"
                      ? "#ef4444"
                      : "var(--ck-text-muted)",
                fontWeight: 600,
                userSelect: "none",
              }}
            >
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            {/* Content */}
            <pre
              style={{
                margin: 0,
                padding: "1px 8px 1px 0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                color:
                  line.type === "same"
                    ? "var(--ck-text-muted)"
                    : "var(--ck-text)",
              }}
            >
              {line.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple LCS-based diff algorithm.
 * Good enough for small-to-medium component code.
 */
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  // Build LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m,
    j = n;

  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({
        type: "same",
        content: oldLines[i - 1],
        lineNum: { old: i, new: j },
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: "add",
        content: newLines[j - 1],
        lineNum: { new: j },
      });
      j--;
    } else {
      stack.push({
        type: "remove",
        content: oldLines[i - 1],
        lineNum: { old: i },
      });
      i--;
    }
  }

  // Reverse since we built bottom-up
  stack.reverse();
  return stack;
}
