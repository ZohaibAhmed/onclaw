"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useClawKit, type GenerationStage } from "./provider";
import { compileComponent } from "../lib/engine";
import { getSuggestions, type PromptSuggestion } from "../lib/suggestions";
import { DiffView } from "./diff-view";
import { StyleEditor } from "./style-editor";

const STAGE_LABELS: Record<GenerationStage, string> = {
  idle: "",
  analyzing: "Analyzing your request...",
  generating: "Generating component...",
  streaming: "Writing code...",
  compiling: "Compiling...",
  done: "Done!",
  error: "Something went wrong",
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

type View = "prompt" | "preview" | "templates" | "streaming";

export function CommandBar() {
  const {
    isOpen,
    close,
    generate,
    generateMultiSlot,
    applyTemplate,
    exportComponent,
    isGenerating,
    generationStage,
    selectedSlot,
    components,
    lastServerMutation,
    slots,
    templates,
    resetSlot,
    rollback,
    streamingCode,
    config,
    rateLimitRemaining,
    shareComponent,
    createSlot,
    dynamicSlotIds,
    applyStyleOverrides,
    styleOverrides,
  } = useClawKit();

  const [input, setInput] = useState("");
  const [view, setView] = useState<View>("prompt");
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("");
  const [exportedCode, setExportedCode] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const activeSlot = selectedSlot ?? pickedSlot;
  const slotEntries = Object.entries(slots);
  const activeComponent = components.find(
    (c) => c.slotId === activeSlot
  );

  // Prompt suggestions
  const suggestions = getSuggestions(
    activeSlot,
    activeSlot ? slots[activeSlot] : undefined,
    input,
    !!activeComponent
  );

  // Check if prompt looks like a multi-slot request
  const isMultiSlotPrompt = (prompt: string): boolean => {
    if (!config.multiSlot) return false;
    const keywords = [
      "everything", "all sections", "whole page", "entire page",
      "all slots", "every section", "complete redesign",
    ];
    return keywords.some((k) => prompt.toLowerCase().includes(k));
  };

  useEffect(() => {
    if (isOpen) {
      setInput("");
      setView("prompt");
      setPickedSlot(selectedSlot ?? "__new__");
      setShowPreview(false);
      setExportedCode(null);
      setTemplateFilter("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // Switch to streaming view when streaming starts
  useEffect(() => {
    if (generationStage === "streaming") {
      setView("streaming");
    }
  }, [generationStage]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isGenerating) return;
    try {
      if (isMultiSlotPrompt(input)) {
        await generateMultiSlot(input.trim());
      } else {
        let targetSlot = activeSlot;
        // If "create new" mode, create a dynamic slot from the prompt
        if (targetSlot === "__new__") {
          // Extract a short name from the prompt (first 3-4 words)
          const words = input.trim().split(/\s+/).slice(0, 4).join(" ");
          const name = words.length > 30 ? words.slice(0, 30) + "…" : words;
          targetSlot = createSlot(name, input.trim());
          setPickedSlot(targetSlot);
        }
        await generate(input.trim(), targetSlot ?? undefined);
      }
      setView("preview");
    } catch {
      // Error handled by provider toast
    }
  }, [input, isGenerating, generate, generateMultiSlot, activeSlot, createSlot]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // If a suggestion is focused, use it
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          setInput(suggestions[focusedIndex].text);
          setFocusedIndex(-1);
          return;
        }
        handleSubmit();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!activeSlot && !input) {
          // Navigate slot list
          const max = Object.keys(slots).length - 1;
          setFocusedIndex((prev) => Math.min(prev + 1, max));
        } else if (suggestions.length > 0) {
          setFocusedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Tab" && suggestions.length > 0 && focusedIndex >= 0) {
        e.preventDefault();
        setInput(suggestions[focusedIndex].text);
        setFocusedIndex(-1);
      }
    },
    [handleSubmit, focusedIndex, suggestions, activeSlot, input, slots]
  );

  // Reset focused index when input changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [input]);

  const handleExport = useCallback(() => {
    if (!activeSlot) return;
    const code = exportComponent(activeSlot);
    if (code) {
      setExportedCode(code);
      // Also copy to clipboard
      navigator.clipboard?.writeText(code).catch(() => {});
    }
  }, [activeSlot, exportComponent]);

  if (!isOpen) return null;

  // ─── Layout ───────────────────────────────────────────

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        animation: "ck-slide-up-mobile 0.25s ease-out",
      }
    : {
        position: "fixed",
        top: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(620px, 90vw)",
        zIndex: 99999,
        animation: "ck-slide-up 0.2s ease-out",
      };

  const panelStyle: React.CSSProperties = {
    background: "var(--ck-bg)",
    border: isMobile ? "none" : "1px solid var(--ck-border)",
    borderRadius: isMobile ? "16px 16px 0 0" : "var(--ck-radius)",
    boxShadow: "var(--ck-shadow)",
    overflow: "hidden",
    fontFamily: "var(--ck-font)",
  };

  // Filtered templates for the active slot
  const filteredTemplates = templates.filter((t) => {
    if (activeSlot && t.category !== activeSlot) return false;
    if (templateFilter) {
      const q = templateFilter.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 99998,
          animation: "ck-fade-in 0.15s ease-out",
        }}
      />

      {/* Panel */}
      <div style={containerStyle}>
        <div style={panelStyle}>
          {/* Mobile drag handle */}
          {isMobile && (
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--ck-border)" }} />
            </div>
          )}

          {/* Header / Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: isMobile ? "12px 16px" : "14px 16px",
              borderBottom: "1px solid var(--ck-border)",
              gap: "10px",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ck-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {activeSlot && (
              <span
                style={{
                  padding: "2px 8px", borderRadius: "4px",
                  background: "var(--ck-bg-hover)", border: "1px solid var(--ck-border)",
                  color: "var(--ck-text-muted)", fontSize: "11px",
                  fontFamily: "var(--ck-font)", whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
                }}
                onClick={() => setPickedSlot(null)}
                title="Click to change target"
              >
                {activeSlot === "__new__" ? "New Component" : (slots[activeSlot]?.name ?? activeSlot)} ×
              </span>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeSlot ? "Describe what you want..." : "Describe what you want to build"}
              disabled={isGenerating}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--ck-text)", fontSize: isMobile ? "16px" : "15px",
                fontFamily: "var(--ck-font)", letterSpacing: "-0.01em", minWidth: 0,
              }}
            />
            {!isMobile && (
              <kbd style={{
                padding: "2px 6px", borderRadius: "4px",
                background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                color: "var(--ck-text-muted)", fontSize: "11px",
                fontFamily: "var(--ck-font)", lineHeight: "1.4", flexShrink: 0,
              }}>
                ESC
              </kbd>
            )}
          </div>

          {/* Tab bar — show when slot is selected and not generating */}
          {activeSlot && !isGenerating && (view === "prompt" || view === ("templates" as View) || view === ("styles" as View)) && (
            <div style={{
              display: "flex", gap: "0", borderBottom: "1px solid var(--ck-border)",
            }}>
              <TabButton active={view === "prompt"} onClick={() => setView("prompt")}>Generate</TabButton>
              {templates.length > 0 && (
                <TabButton active={view === ("templates" as View)} onClick={() => setView("templates" as View)}>Templates</TabButton>
              )}
              <TabButton active={view === ("styles" as View)} onClick={() => setView("styles" as View)}>Styles</TabButton>
            </div>
          )}

          {/* Content */}
          <div style={{ maxHeight: isMobile ? "60vh" : "400px", overflowY: "auto" }}>
            {isGenerating && view !== "streaming" ? (
              /* ─── Loading state with stages ─── */
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "48px 24px", gap: "16px",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  border: "2px solid var(--ck-border)", borderTopColor: "var(--ck-accent)",
                  animation: "ck-spin 0.8s linear infinite",
                }} />
                <span style={{ color: "var(--ck-text-muted)", fontSize: "13px", animation: "ck-fade-in 0.3s ease-out" }}>
                  {STAGE_LABELS[generationStage]}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {(["analyzing", "generating", "compiling"] as const).map((stage, i) => (
                    <div key={stage} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: generationStage === stage || ["analyzing", "generating", "compiling"].indexOf(generationStage) > i
                        ? "var(--ck-accent)" : "var(--ck-border)",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                {isMultiSlotPrompt(input) && (
                  <span style={{ color: "var(--ck-text-muted)", fontSize: "11px" }}>
                    Updating all sections...
                  </span>
                )}
              </div>
            ) : view === "streaming" ? (
              /* ─── Streaming code view ─── */
              <div style={{ padding: "16px" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px",
                }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#22c55e", animation: "ck-pulse 1s infinite",
                  }} />
                  <span style={{ color: "var(--ck-text)", fontSize: "13px", fontWeight: 500 }}>
                    Writing code...
                  </span>
                  <span style={{ color: "var(--ck-text-muted)", fontSize: "11px", marginLeft: "auto" }}>
                    {streamingCode.length} chars
                  </span>
                </div>
                <pre style={{
                  padding: "12px", borderRadius: "6px",
                  background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                  color: "var(--ck-text-muted)", fontSize: "11px", fontFamily: "monospace",
                  whiteSpace: "pre-wrap", wordBreak: "break-all",
                  maxHeight: "200px", overflowY: "auto",
                }}>
                  {streamingCode || "..."}
                </pre>
                {/* Live preview attempt */}
                <StreamingPreview code={streamingCode} />
              </div>
            ) : view === "preview" ? (
              /* ─── Preview / Success ─── */
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: generationStage === "error" ? "#ef4444" : "#22c55e",
                  }} />
                  <span style={{ color: "var(--ck-text)", fontSize: "14px", fontWeight: 500 }}>
                    {generationStage === "error" ? "Something went wrong" : "Changes applied"}
                  </span>
                </div>

                {/* Live preview pane */}
                {activeComponent && showPreview && (
                  <div style={{
                    marginBottom: "12px", padding: "16px", borderRadius: "8px",
                    background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                    minHeight: "80px", overflow: "hidden",
                  }}>
                    <div style={{
                      fontSize: "10px", fontWeight: 600, color: "var(--ck-text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px",
                    }}>
                      Preview
                    </div>
                    <LivePreview code={activeComponent.code} />
                  </div>
                )}

                {/* Server mutation file list */}
                {lastServerMutation && lastServerMutation.files?.length > 0 && (
                  <div style={{
                    marginBottom: "12px", padding: "10px 12px", borderRadius: "6px",
                    background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                  }}>
                    <div style={{
                      fontSize: "11px", fontWeight: 600, color: "var(--ck-text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px",
                    }}>
                      What changed
                    </div>
                    {lastServerMutation.files.map((f, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "3px 0", fontSize: "12px", fontFamily: "monospace",
                      }}>
                        <span style={{
                          color: f.action === "create" ? "#22c55e" : f.action === "delete" ? "#ef4444" : "#f59e0b",
                          fontSize: "10px", fontWeight: 600, textTransform: "uppercase", width: "48px",
                        }}>
                          {f.action}
                        </span>
                        <span style={{ color: "var(--ck-text)" }}>{f.path}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Exported code view */}
                {exportedCode && (
                  <div style={{
                    marginBottom: "12px", padding: "10px 12px", borderRadius: "6px",
                    background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginBottom: "8px",
                    }}>
                      <div style={{
                        fontSize: "11px", fontWeight: 600, color: "var(--ck-text-muted)",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        Exported Code
                      </div>
                      <span style={{ fontSize: "11px", color: "#22c55e" }}>Copied to clipboard!</span>
                    </div>
                    <pre style={{
                      fontSize: "11px", fontFamily: "monospace", color: "var(--ck-text-muted)",
                      whiteSpace: "pre-wrap", maxHeight: "150px", overflowY: "auto", margin: 0,
                    }}>
                      {exportedCode}
                    </pre>
                  </div>
                )}

                {/* Diff view */}
                {showDiff && activeComponent && activeComponent.history.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <DiffView
                      oldCode={activeComponent.history[activeComponent.history.length - 1].code}
                      newCode={activeComponent.code}
                    />
                  </div>
                )}

                <p style={{ color: "var(--ck-text-muted)", fontSize: "13px", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                  Your changes are live. You can iterate or close.
                </p>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <CKButton
                    onClick={() => {
                      setView("prompt");
                      setInput("");
                      setExportedCode(null);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    variant="secondary"
                  >
                    Modify
                  </CKButton>
                  <CKButton
                    onClick={() => setShowPreview((p) => !p)}
                    variant="secondary"
                  >
                    {showPreview ? "Hide Preview" : "Preview"}
                  </CKButton>
                  <CKButton onClick={handleExport} variant="secondary">
                    Export
                  </CKButton>
                  {activeSlot && (
                    <CKButton
                      onClick={() => shareComponent(activeSlot)}
                      variant="secondary"
                    >
                      Share
                    </CKButton>
                  )}
                  {activeComponent && activeComponent.history.length > 0 && (
                    <CKButton
                      onClick={() => setShowDiff((p) => !p)}
                      variant="secondary"
                    >
                      {showDiff ? "Hide Diff" : "Diff"}
                    </CKButton>
                  )}
                  {activeComponent && activeComponent.history.length > 0 && (
                    <CKButton
                      onClick={() => { rollback(activeComponent.id); setView("prompt"); }}
                      variant="secondary"
                    >
                      ↩ Undo
                    </CKButton>
                  )}
                  {activeSlot && activeComponent && (
                    <CKButton
                      onClick={() => { resetSlot(activeSlot); close(); }}
                      variant="secondary"
                    >
                      Reset
                    </CKButton>
                  )}
                  <CKButton onClick={close} variant="primary">Done</CKButton>
                </div>
              </div>
            ) : view === ("styles" as View) ? (
              /* ─── Style Quick Editor ─── */
              <StyleEditor
                onApply={applyStyleOverrides}
                currentOverrides={styleOverrides}
              />
            ) : view === ("templates" as View) ? (
              /* ─── Template Gallery ─── */
              <div style={{ padding: "8px" }}>
                <div style={{ padding: "8px 8px 4px" }}>
                  <input
                    value={templateFilter}
                    onChange={(e) => setTemplateFilter(e.target.value)}
                    placeholder="Search templates..."
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: "6px",
                      background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                      color: "var(--ck-text)", fontSize: "13px", fontFamily: "var(--ck-font)",
                      outline: "none",
                    }}
                  />
                </div>
                {filteredTemplates.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center" }}>
                    <p style={{ color: "var(--ck-text-muted)", fontSize: "13px", margin: 0 }}>
                      No templates available{activeSlot ? ` for ${slots[activeSlot]?.name}` : ""}.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "8px" }}>
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (activeSlot) {
                            applyTemplate(t, activeSlot);
                            setView("preview");
                          }
                        }}
                        style={{
                          textAlign: "left", padding: "12px", borderRadius: "8px",
                          border: "1px solid var(--ck-border)", background: "var(--ck-bg-secondary)",
                          cursor: "pointer", fontFamily: "var(--ck-font)", transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ck-accent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ck-border)")}
                      >
                        <div style={{ color: "var(--ck-text)", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>
                          {t.name}
                        </div>
                        {t.description && (
                          <div style={{ color: "var(--ck-text-muted)", fontSize: "11px", lineHeight: 1.4 }}>
                            {t.description}
                          </div>
                        )}
                        {t.tags && (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                            {t.tags.map((tag) => (
                              <span key={tag} style={{
                                padding: "1px 6px", borderRadius: "3px", fontSize: "10px",
                                background: "var(--ck-bg-hover)", color: "var(--ck-text-muted)",
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ─── Prompt view ─── */
              <>
                {/* Existing component for this slot */}
                {components.length > 0 && !input && activeSlot && (
                  <div style={{ padding: "8px" }}>
                    <div style={{
                      padding: "6px 8px", fontSize: "11px", fontWeight: 600,
                      color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      Current customization
                    </div>
                    {components.filter((c) => c.slotId === activeSlot).map((c) => (
                      <div key={c.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 12px", borderRadius: "6px",
                      }}>
                        <div>
                          <div style={{ color: "var(--ck-text)", fontSize: "13px" }}>"{c.prompt}"</div>
                          <div style={{ color: "var(--ck-text-muted)", fontSize: "11px", marginTop: "2px" }}>
                            {c.history.length} version{c.history.length !== 1 ? "s" : ""}
                            {" · "}
                            <span style={{ cursor: "pointer", textDecoration: "underline" }}
                              onClick={() => { setShowPreview(true); setView("preview"); }}>
                              preview
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {c.history.length > 0 && (
                            <CKButton onClick={() => rollback(c.id)} variant="ghost" size="sm">↩</CKButton>
                          )}
                          <CKButton onClick={() => resetSlot(c.slotId)} variant="ghost" size="sm">✕</CKButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Slot quick-picks */}
                {!input && (
                  <div style={{ padding: "8px" }}>
                    {!activeSlot && slotEntries.length > 0 && (
                      <>
                        <div style={{
                          padding: "6px 8px", fontSize: "11px", fontWeight: 600,
                          color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          Pick a section or create something new
                        </div>
                        {slotEntries.map(([id, cfg]) => (
                          <button
                            key={id}
                            onClick={() => { setPickedSlot(id); setTimeout(() => inputRef.current?.focus(), 50); }}
                            style={{
                              display: "block", width: "100%", textAlign: "left",
                              padding: "10px 12px", borderRadius: "6px", border: "none",
                              background: "transparent", cursor: "pointer",
                              fontFamily: "var(--ck-font)", transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ck-bg-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ color: "var(--ck-text)", fontSize: "13px", fontWeight: 500 }}>
                                {cfg.name}
                              </div>
                              {components.find((c) => c.slotId === id) && (
                                <span style={{
                                  width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e",
                                }} />
                              )}
                            </div>
                            {cfg.description && (
                              <div style={{ color: "var(--ck-text-muted)", fontSize: "12px", marginTop: "2px" }}>
                                {cfg.description}
                              </div>
                            )}
                          </button>
                        ))}
                        {/* Create new component */}
                        <div style={{ borderTop: "1px solid var(--ck-border)", margin: "4px 0", padding: "4px 0" }} />
                        <button
                          onClick={() => {
                            setPickedSlot("__new__");
                            setTimeout(() => inputRef.current?.focus(), 50);
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            width: "100%", textAlign: "left",
                            padding: "10px 12px", borderRadius: "6px", border: "none",
                            background: "transparent", cursor: "pointer",
                            fontFamily: "var(--ck-font)", transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ck-bg-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontSize: "16px", color: "var(--ck-accent)" }}>＋</span>
                          <div>
                            <div style={{ color: "var(--ck-accent)", fontSize: "13px", fontWeight: 500 }}>
                              Create new component
                            </div>
                            <div style={{ color: "var(--ck-text-muted)", fontSize: "12px", marginTop: "2px" }}>
                              Describe anything — a widget, chart, form, etc.
                            </div>
                          </div>
                        </button>
                      </>
                    )}
                    {activeSlot && !components.find((c) => c.slotId === activeSlot) && (
                      <div style={{ padding: "24px 16px", textAlign: "center" }}>
                        <p style={{ color: "var(--ck-text-muted)", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                          Describe what you want — just type and hit Enter.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt suggestions */}
                {activeSlot && input.length < 40 && suggestions.length > 0 && (
                  <div style={{ padding: "4px 8px" }}>
                    <div style={{
                      padding: "4px 8px", fontSize: "10px", fontWeight: 600,
                      color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      Suggestions
                    </div>
                    {suggestions.slice(0, 5).map((s, i) => (
                      <button
                        key={s.text}
                        onClick={() => { setInput(s.text); setFocusedIndex(-1); setTimeout(() => inputRef.current?.focus(), 50); }}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          width: "100%", textAlign: "left",
                          padding: "7px 10px", borderRadius: "6px", border: "none",
                          background: focusedIndex === i ? "var(--ck-bg-hover)" : "transparent",
                          cursor: "pointer", fontFamily: "var(--ck-font)", transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget.style.background = "var(--ck-bg-hover)"); setFocusedIndex(i); }}
                        onMouseLeave={(e) => { (e.currentTarget.style.background = "transparent"); }}
                      >
                        <span style={{ fontSize: "14px", width: "20px", textAlign: "center" }}>{s.icon}</span>
                        <span style={{ color: "var(--ck-text)", fontSize: "12px" }}>{s.text}</span>
                        <span style={{
                          marginLeft: "auto", fontSize: "10px", padding: "1px 6px",
                          borderRadius: "3px", background: "var(--ck-bg-secondary)",
                          color: "var(--ck-text-muted)",
                        }}>
                          {s.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Multi-slot hint */}
                {input && isMultiSlotPrompt(input) && config.multiSlot && (
                  <div style={{
                    margin: "0 8px 8px", padding: "8px 12px", borderRadius: "6px",
                    background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                  }}>
                    <span style={{ color: "var(--ck-text-muted)", fontSize: "12px" }}>
                      ✨ This will update <strong style={{ color: "var(--ck-text)" }}>all {slotEntries.length} sections</strong>
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: isMobile ? "12px 16px 24px" : "10px 16px",
            borderTop: "1px solid var(--ck-border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "var(--ck-text-muted)", opacity: 0.5 }}>
                ClawKit
              </span>
              {rateLimitRemaining < Infinity && rateLimitRemaining <= 3 && (
                <span style={{ fontSize: "10px", color: rateLimitRemaining === 0 ? "#ef4444" : "#f59e0b" }}>
                  {rateLimitRemaining} left
                </span>
              )}
            </div>
            {input.trim() && !isGenerating && (
              <CKButton onClick={handleSubmit} variant="primary" size="sm">
                Generate ↵
              </CKButton>
            )}
            {!input.trim() && !isGenerating && (
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <kbd style={{
                  padding: "2px 6px", borderRadius: "4px",
                  background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
                  color: "var(--ck-text-muted)", fontSize: "11px", fontFamily: "var(--ck-font)",
                }}>
                  ↵
                </kbd>
                <span style={{ color: "var(--ck-text-muted)", fontSize: "11px" }}>to generate</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes ck-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ck-slide-up { from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.98); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        @keyframes ck-slide-up-mobile { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes ck-spin { to { transform: rotate(360deg); } }
        @keyframes ck-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
}

// ─── Live Preview Component ─────────────────────────────

function LivePreview({ code }: { code: string }) {
  const { ctxBridge } = useClawKit();
  const [rendered, setRendered] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const fn = compileComponent(code, React, ctxBridge);
      if (fn) {
        setRendered(React.createElement(fn, {}));
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  }, [code, ctxBridge]);

  if (error) {
    return (
      <div style={{ color: "#ef4444", fontSize: "11px", fontFamily: "monospace" }}>
        Preview error: {error}
      </div>
    );
  }

  return <div style={{ transform: "scale(0.75)", transformOrigin: "top left" }}>{rendered}</div>;
}

// ─── Streaming Preview (attempts compile periodically) ──

function StreamingPreview({ code }: { code: string }) {
  const { ctxBridge } = useClawKit();
  const [rendered, setRendered] = useState<React.ReactNode>(null);

  useEffect(() => {
    // Attempt to compile every time code updates (will fail until code is complete)
    try {
      const fn = compileComponent(code, React, ctxBridge);
      if (fn) {
        setRendered(React.createElement(fn, {}));
      }
    } catch {
      // Incomplete code — ignore
    }
  }, [code]);

  if (!rendered) return null;

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{
        fontSize: "10px", fontWeight: 600, color: "var(--ck-text-muted)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px",
      }}>
        Live Preview
      </div>
      <div style={{
        padding: "12px", borderRadius: "6px",
        background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
        overflow: "hidden", transform: "scale(0.7)", transformOrigin: "top left",
      }}>
        {rendered}
      </div>
    </div>
  );
}

// ─── Tab Button ─────────────────────────────────────────

function TabButton({ children, active, onClick }: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px", fontSize: "12px", fontWeight: 500,
        background: "transparent", border: "none",
        borderBottom: active ? "2px solid var(--ck-accent)" : "2px solid transparent",
        color: active ? "var(--ck-text)" : "var(--ck-text-muted)",
        cursor: "pointer", fontFamily: "var(--ck-font)", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Shared button component ────────────────────────────

function CKButton({
  children,
  onClick,
  variant = "secondary",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = React.useState(false);

  const base: React.CSSProperties = {
    borderRadius: size === "sm" ? "4px" : "var(--ck-radius)",
    fontSize: size === "sm" ? "11px" : "13px",
    padding: size === "sm" ? "3px 8px" : "8px 16px",
    cursor: "pointer",
    fontFamily: "var(--ck-font)",
    transition: "all 0.15s",
    border: "none",
    fontWeight: variant === "primary" ? 500 : 400,
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: { ...base, background: "var(--ck-accent)", color: "var(--ck-accent-text)", opacity: hovered ? 0.9 : 1 },
    secondary: { ...base, background: hovered ? "var(--ck-bg-hover)" : "var(--ck-bg-secondary)", color: "var(--ck-text)", border: "1px solid var(--ck-border)" },
    ghost: { ...base, background: hovered ? "var(--ck-bg-hover)" : "transparent", color: "var(--ck-text-muted)" },
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}
