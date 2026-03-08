"use client";

import React, { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from "react";
import { useOnClaw } from "./provider";

/** Error boundary for user-generated components */
class SlotErrorBoundary extends Component<
  { children: ReactNode; slotId: string; onEdit: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[OnClaw] Slot "${this.props.slotId}" error:`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: "16px", borderRadius: "var(--ck-radius)",
            border: "1px solid hsl(0 62% 30%)", background: "hsl(0 62% 8%)",
            fontFamily: "var(--ck-font)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "hsl(0 62% 70%)", fontSize: "13px" }}>
              Component error in "{this.props.slotId}"
            </span>
            <button
              onClick={() => { this.setState({ error: null }); this.props.onEdit(); }}
              style={{
                padding: "4px 12px", borderRadius: "4px", background: "transparent",
                border: "1px solid hsl(0 62% 30%)", color: "hsl(0 62% 70%)",
                fontSize: "12px", cursor: "pointer",
              }}
            >
              Fix it
            </button>
          </div>
          <pre style={{ fontSize: "11px", color: "hsl(0 62% 50%)", marginTop: "8px", overflow: "auto", whiteSpace: "pre-wrap" }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Animated wrapper that fades in new content when the component changes.
 */
function TransitionWrapper({ children, transitionKey }: { children: ReactNode; transitionKey: string }) {
  const [visible, setVisible] = useState(false);
  const prevKey = useRef(transitionKey);

  useEffect(() => {
    if (prevKey.current !== transitionKey) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 50);
      prevKey.current = transitionKey;
      return () => clearTimeout(t);
    } else {
      setVisible(true);
    }
  }, [transitionKey]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      {children}
    </div>
  );
}

interface SlotProps {
  /** Unique slot identifier */
  id: string;
  /** Fallback content when no user component exists */
  children?: ReactNode;
  /** Props to pass to the generated component */
  props?: Record<string, unknown>;
  /** Show an edit button overlay */
  editable?: boolean;
  /** Custom className for the wrapper */
  className?: string;
  /** Custom style for the wrapper */
  style?: React.CSSProperties;
  /** Disable transition animation */
  noTransition?: boolean;
}

export function Slot({
  id,
  children,
  props: slotProps = {},
  editable = true,
  className,
  style,
  noTransition = false,
}: SlotProps) {
  const { getSlotComponent, open, highlightedSlots, slots, components } = useOnClaw();
  const [hovered, setHovered] = React.useState(false);
  const UserComp = getSlotComponent(id);
  const isCustomized = !!components.find((c) => c.slotId === id);
  const slotName = slots[id]?.name ?? id;
  const comp = components.find((c) => c.slotId === id);
  const transitionKey = comp ? `${comp.id}_${comp.updatedAt}` : "default";

  const content = UserComp ? <UserComp {...slotProps} /> : children;
  const wrapped = noTransition ? content : (
    <TransitionWrapper transitionKey={transitionKey}>{content}</TransitionWrapper>
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        ...style,
        ...(highlightedSlots ? {
          outline: "2px dashed var(--ck-accent)",
          outlineOffset: "2px",
          borderRadius: "var(--ck-radius)",
          animation: "ck-highlight-pulse 2s ease-in-out infinite",
        } : {}),
        transition: "outline 0.3s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-onclaw-slot={id}
    >
      <SlotErrorBoundary slotId={id} onEdit={() => open(id)}>
        {wrapped}
      </SlotErrorBoundary>

      {/* Slot label when highlighted */}
      {highlightedSlots && (
        <button
          onClick={() => open(id)}
          style={{
            position: "absolute", top: "-10px", left: "12px",
            padding: "2px 10px", borderRadius: "4px",
            background: "var(--ck-accent)", color: "var(--ck-accent-text)",
            fontSize: "10px", fontWeight: 600, fontFamily: "var(--ck-font)",
            cursor: "pointer", border: "none", zIndex: 20,
            letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: "4px",
          }}
        >
          {isCustomized && (
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
          )}
          {slotName}
        </button>
      )}

      {/* Edit overlay on hover */}
      {editable && hovered && !highlightedSlots && (
        <button
          onClick={() => open(id)}
          style={{
            position: "absolute", top: "8px", right: "8px",
            padding: "4px 10px", borderRadius: "6px",
            background: "var(--ck-bg)", border: "1px solid var(--ck-border)",
            color: "var(--ck-text-muted)", fontSize: "11px", cursor: "pointer",
            fontFamily: "var(--ck-font)", display: "flex", alignItems: "center", gap: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)", transition: "all 0.15s", zIndex: 10, opacity: 0.9,
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.9"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
          </svg>
          Edit
        </button>
      )}

      {highlightedSlots && (
        <style>{`
          @keyframes ck-highlight-pulse {
            0%, 100% { outline-color: var(--ck-accent); }
            50% { outline-color: transparent; }
          }
        `}</style>
      )}
    </div>
  );
}
