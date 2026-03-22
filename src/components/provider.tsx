"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  OnClawConfig,
  OnClawTheme,
  ConversationMessage,
  TemplateItem,
  UserComponent,
} from "../types";
import { LocalStoreAdapter } from "../store/local";
import { compileComponent, generateComponent, generateComponentStream } from "../lib/engine";
import { runBeforeGenerate, runAfterGenerate, runValidate } from "../lib/plugins";
import { refinePrompt } from "../lib/smart-prompt";
import { generateShareUrl, parseShareFromUrl } from "../lib/share";
import { createContextBridge } from "../lib/context-bridge";
import { CommandBar } from "./command-bar";
import { FloatingTrigger } from "./floating-trigger";
import { Toast } from "./toast";

// ─── Types ──────────────────────────────────────────────

export type MutationMode = "client" | "server";
export type GenerationStage =
  | "idle"
  | "analyzing"
  | "generating"
  | "streaming"
  | "compiling"
  | "done"
  | "error";

export interface ServerMutationResult {
  id: string;
  files: { path: string; action: string }[];
  needsRebuild: boolean;
  status: string;
  clientCode?: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface OnClawContextValue {
  userId: string;
  config: OnClawConfig;
  components: UserComponent[];
  isOpen: boolean;
  isGenerating: boolean;
  generationStage: GenerationStage;
  selectedSlot: string | null;
  mode: MutationMode;
  hasServerSupport: boolean;
  lastServerMutation: ServerMutationResult | null;
  slots: Record<string, import("../types").SlotConfig>;
  toasts: ToastMessage[];
  streamingCode: string;
  conversationHistory: Map<string, ConversationMessage[]>;
  highlightedSlots: boolean;
  templates: TemplateItem[];
  rateLimitRemaining: number;
  open: (slotId?: string) => void;
  close: () => void;
  generate: (prompt: string, slotId?: string) => Promise<void>;
  generateMultiSlot: (prompt: string) => Promise<void>;
  applyTemplate: (template: TemplateItem, slotId: string) => Promise<void>;
  getSlotComponent: (
    slotId: string
  ) => ((props: Record<string, unknown>) => React.ReactNode) | null;
  removeComponent: (componentId: string) => Promise<void>;
  rollback: (componentId: string) => Promise<void>;
  resetSlot: (slotId: string) => Promise<void>;
  exportComponent: (slotId: string) => string | null;
  shareComponent: (slotId: string) => Promise<string | null>;
  importSharedComponent: (slotId: string, code: string, prompt: string) => Promise<void>;
  createSlot: (name: string, description?: string) => string;
  dynamicSlotIds: string[];
  dismissToast: (id: string) => void;
  setHighlightedSlots: (v: boolean) => void;
  applyStyleOverrides: (overrides: Record<string, string>) => void;
  styleOverrides: Record<string, string>;
  ctxBridge: any;
}

const OnClawContext = createContext<OnClawContextValue | null>(null);

export function useOnClaw() {
  const ctx = useContext(OnClawContext);
  if (!ctx)
    throw new Error("useOnClaw must be used within a OnClawProvider");
  return ctx;
}

// ─── Theme ──────────────────────────────────────────────

const DARK_THEME: OnClawTheme = {
  "--ck-bg": "hsl(0 0% 3.9%)",
  "--ck-bg-secondary": "hsl(0 0% 9%)",
  "--ck-bg-hover": "hsl(0 0% 14.9%)",
  "--ck-border": "hsl(0 0% 14.9%)",
  "--ck-text": "hsl(0 0% 98%)",
  "--ck-text-muted": "hsl(0 0% 63.9%)",
  "--ck-accent": "hsl(0 0% 98%)",
  "--ck-accent-text": "hsl(0 0% 3.9%)",
  "--ck-radius": "0.5rem",
  "--ck-shadow":
    "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
  "--ck-font":
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const LIGHT_THEME: OnClawTheme = {
  "--ck-bg": "hsl(0 0% 100%)",
  "--ck-bg-secondary": "hsl(0 0% 96%)",
  "--ck-bg-hover": "hsl(0 0% 92%)",
  "--ck-border": "hsl(0 0% 89.8%)",
  "--ck-text": "hsl(0 0% 3.9%)",
  "--ck-text-muted": "hsl(0 0% 45.1%)",
  "--ck-accent": "hsl(0 0% 9%)",
  "--ck-accent-text": "hsl(0 0% 98%)",
  "--ck-radius": "0.5rem",
  "--ck-shadow":
    "0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05)",
  "--ck-font":
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

function useThemeDetection(mode: "light" | "dark" | "auto"): OnClawTheme {
  const [isDark, setIsDark] = useState(mode === "dark");

  useEffect(() => {
    if (mode !== "auto") {
      setIsDark(mode === "dark");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  return isDark ? DARK_THEME : LIGHT_THEME;
}

// ─── Auto-detect slot ───────────────────────────────────

function autoDetectSlot(
  prompt: string,
  slots: Record<string, import("../types").SlotConfig>
): string | undefined {
  const lower = prompt.toLowerCase();
  let bestMatch: string | undefined;
  let bestScore = 0;

  for (const [id, cfg] of Object.entries(slots)) {
    let score = 0;
    if (lower.includes(id.toLowerCase())) score += 3;
    for (const word of cfg.name.toLowerCase().split(/\s+/)) {
      if (word.length > 2 && lower.includes(word)) score += 2;
    }
    if (cfg.description) {
      for (const word of cfg.description.toLowerCase().split(/\s+/)) {
        if (word.length > 3 && lower.includes(word)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = id;
    }
  }

  return bestScore >= 2 ? bestMatch : undefined;
}

// ─── Rate limiter ───────────────────────────────────────

function useRateLimiter(config: OnClawConfig) {
  const timestampsRef = useRef<number[]>([]);

  const check = useCallback((): { allowed: boolean; remaining: number } => {
    if (!config.rateLimit) return { allowed: true, remaining: Infinity };
    const { maxGenerations, windowMs } = config.rateLimit;
    const now = Date.now();
    timestampsRef.current = timestampsRef.current.filter(
      (t) => now - t < windowMs
    );
    if (timestampsRef.current.length >= maxGenerations) {
      return { allowed: false, remaining: 0 };
    }
    return {
      allowed: true,
      remaining: maxGenerations - timestampsRef.current.length,
    };
  }, [config.rateLimit]);

  const record = useCallback(() => {
    timestampsRef.current.push(Date.now());
  }, []);

  return { check, record };
}

// ─── Provider ───────────────────────────────────────────

export function OnClawProvider({
  children,
  ...config
}: OnClawConfig & { children: React.ReactNode }) {
  const store = useMemo(
    () => config.store ?? new LocalStoreAdapter(),
    [config.store]
  );
  const [components, setComponents] = useState<UserComponent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] =
    useState<GenerationStage>("idle");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mode] = useState<MutationMode>(
    config.serverUrl ? "server" : "client"
  );
  const [lastServerMutation, setLastServerMutation] =
    useState<ServerMutationResult | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [streamingCode, setStreamingCode] = useState("");
  const [highlightedSlots, setHighlightedSlots] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(Infinity);
  const hasServerSupport = !!config.serverUrl;
  const compiledRef = useRef<
    Map<string, (props: Record<string, unknown>) => React.ReactNode>
  >(new Map());

  // Conversation history per slot for iterative refinement
  const conversationHistoryRef = useRef<Map<string, ConversationMessage[]>>(
    new Map()
  );
  const [conversationHistory] = useState(conversationHistoryRef.current);

  const [dynamicStyleOverrides, setDynamicStyleOverrides] = useState<Record<string, string>>({});
  const [dynamicSlots, setDynamicSlots] = useState<Record<string, import("../types").SlotConfig>>({});
  const rateLimiter = useRateLimiter(config);
  const plugins = config.plugins ?? [];

  // Context bridge — enables generated components to call server-side queries
  const ctxBridge = useMemo(() => {
    const endpoint = config.endpoint
      ? config.endpoint.replace(/\/generate$/, "/context").replace(/\/stream$/, "/context")
      : "/api/onclaw/context";
    return createContextBridge({ endpoint });
  }, [config.endpoint]);

  // Merge static + dynamic slots
  const mergedSlots = useMemo(() => ({
    ...(config.slots ?? {}),
    ...dynamicSlots,
  }), [config.slots, dynamicSlots]);

  // SSR safety
  useEffect(() => setMounted(true), []);

  // Check for shared component in URL on mount
  useEffect(() => {
    const shared = parseShareFromUrl();
    if (shared) {
      const fn = compileComponent(shared.code, React, ctxBridge);
      if (fn) {
        const now = Date.now();
        const component: UserComponent = {
          id: `ck_shared_${now.toString(36)}`,
          slotId: shared.slotId,
          userId: config.userId,
          prompt: shared.prompt,
          code: shared.code,
          render: fn,
          createdAt: now,
          updatedAt: now,
          history: [],
        };
        compiledRef.current.set(component.id, fn);
        store.save(component);
        setComponents((prev) => [...prev.filter((c) => c.slotId !== shared.slotId), component]);
        addToast("success", "Imported shared component");
        // Clean up URL
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme
  const baseTheme = useThemeDetection(config.theme ?? "auto");
  const theme = { ...baseTheme, ...config.themeOverrides, ...dynamicStyleOverrides };

  // Toast helpers
  const addToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
      const id = `t_${Date.now()}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        5000
      );
    },
    []
  );
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load components on mount
  useEffect(() => {
    store.load(config.userId).then((loaded) => {
      setComponents(loaded);
      for (const comp of loaded) {
        const fn = compileComponent(comp.code, React, ctxBridge);
        if (fn) compiledRef.current.set(comp.id, fn);
      }
    });
  }, [config.userId, store]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Highlight slots when command bar opens
  useEffect(() => {
    if (isOpen && !selectedSlot) {
      setHighlightedSlots(true);
    } else {
      setHighlightedSlots(false);
    }
  }, [isOpen, selectedSlot]);

  const open = useCallback((slotId?: string) => {
    setSelectedSlot(slotId ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedSlot(null);
    setGenerationStage("idle");
    setStreamingCode("");
  }, []);

  // ─── Save a component to store + state ────────────────

  const saveComponent = useCallback(
    async (
      targetSlot: string,
      code: string,
      prompt: string,
      existing?: UserComponent
    ) => {
      const fn = compileComponent(code, React, ctxBridge);
      if (!fn) throw new Error("Generated component failed to compile");

      const now = Date.now();
      const component: UserComponent = existing
        ? {
            ...existing,
            code,
            prompt,
            updatedAt: now,
            render: fn,
            history: [
              ...existing.history,
              {
                code: existing.code,
                prompt: existing.prompt,
                timestamp: existing.updatedAt,
              },
            ],
          }
        : {
            id: `ck_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            slotId: targetSlot,
            userId: config.userId,
            prompt,
            code,
            render: fn,
            createdAt: now,
            updatedAt: now,
            history: [],
          };

      compiledRef.current.set(component.id, fn);
      await store.save(component);
      setComponents((prev) => {
        const filtered = prev.filter((c) => c.id !== component.id);
        return [...filtered, component];
      });

      return component;
    },
    [config.userId, store]
  );

  // ─── Server generation ────────────────────────────────

  const generateServer = useCallback(
    async (prompt: string, slotId: string) => {
      if (!config.serverUrl) throw new Error("No serverUrl configured");
      setGenerationStage("generating");

      const res = await fetch(config.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          userId: config.userId,
          slotId,
          slotContext: mergedSlots[slotId],
        }),
      });
      if (!res.ok) throw new Error(`Server mutation failed: ${res.status}`);
      const result = await res.json();
      setLastServerMutation(result);

      if (result.clientCode) {
        setGenerationStage("compiling");
        const existing = components.find((c) => c.slotId === slotId);
        await saveComponent(slotId, result.clientCode, prompt, existing);
      }
    },
    [config, components, saveComponent]
  );

  // ─── Main generate ────────────────────────────────────

  const generate = useCallback(
    async (prompt: string, slotId?: string) => {
      const resolvedSlot =
        slotId ??
        selectedSlot ??
        autoDetectSlot(prompt, mergedSlots) ??
        "default";
      const existing = components.find((c) => c.slotId === resolvedSlot);
      const slotConfig = mergedSlots[resolvedSlot];

      // Rate limiting
      const { allowed, remaining } = rateLimiter.check();
      if (!allowed) {
        const msg =
          config.rateLimit?.message ??
          "Rate limit reached. Please wait before generating again.";
        addToast("error", msg);
        return;
      }
      setRateLimitRemaining(remaining - 1);

      // Moderation hook
      if (config.events?.onBeforeGenerate) {
        const proceed = await config.events.onBeforeGenerate({
          prompt,
          slotId: resolvedSlot,
          userId: config.userId,
        });
        if (!proceed) {
          addToast("error", "Generation blocked by content policy");
          return;
        }
      }

      // Fire start event
      config.events?.onGenerateStart?.({
        prompt,
        slotId: resolvedSlot,
        userId: config.userId,
      });

      const startTime = Date.now();
      setIsGenerating(true);
      setGenerationStage("analyzing");
      setStreamingCode("");

      // Smart prompt refinement
      let refinedPrompt = prompt;
      if (config.smartPrompts) {
        refinedPrompt = refinePrompt(prompt, resolvedSlot, slotConfig, !!existing);
      }

      // Run plugin beforeGenerate hooks
      if (plugins.length > 0) {
        refinedPrompt = await runBeforeGenerate(plugins, {
          prompt: refinedPrompt,
          slotId: resolvedSlot,
          slotConfig,
          existingCode: existing?.code,
        });
      }

      // Get conversation history for this slot
      const history = conversationHistoryRef.current.get(resolvedSlot) ?? [];

      try {
        if (mode === "server") {
          await generateServer(refinedPrompt, resolvedSlot);
        } else {
          const endpoint = config.endpoint ?? "/api/onclaw/generate";
          const streamEndpoint = config.streamEndpoint;
          const request = {
            prompt: refinedPrompt,
            slotId: resolvedSlot,
            slotContext: slotConfig,
            existingCode: existing?.code,
            appContext: config.appStyle,
            conversationHistory: history,
          };

          let result;
          if (streamEndpoint) {
            setGenerationStage("streaming");
            let rafPending = false;
            let latestAccumulated = "";
            result = await generateComponentStream(
              request,
              streamEndpoint,
              (_token, accumulated) => {
                latestAccumulated = accumulated;
                if (!rafPending) {
                  rafPending = true;
                  requestAnimationFrame(() => {
                    rafPending = false;
                    setStreamingCode(latestAccumulated);
                  });
                }
              }
            );
          } else {
            setGenerationStage("generating");
            result = await generateComponent(request, endpoint);
          }

          // Run plugin afterGenerate hooks
          let finalCode = result.code;
          if (plugins.length > 0) {
            finalCode = await runAfterGenerate(plugins, {
              code: finalCode,
              prompt: refinedPrompt,
              slotId: resolvedSlot,
            });
            // Run validation
            const validationError = await runValidate(plugins, {
              code: finalCode,
              slotId: resolvedSlot,
            });
            if (validationError) {
              throw new Error(validationError);
            }
          }

          setGenerationStage("compiling");
          await saveComponent(resolvedSlot, finalCode, prompt, existing);

          // Update conversation history
          const updatedHistory: ConversationMessage[] = [
            ...history,
            { role: "user", content: prompt },
            { role: "assistant", content: result.code },
          ];
          // Keep last 6 messages (3 turns) per slot
          conversationHistoryRef.current.set(
            resolvedSlot,
            updatedHistory.slice(-6)
          );
        }

        setGenerationStage("done");
        addToast("success", "Component updated");
        rateLimiter.record();

        // Fire complete event
        const durationMs = Date.now() - startTime;
        const comp = components.find((c) => c.slotId === resolvedSlot);
        config.events?.onGenerateComplete?.({
          prompt,
          slotId: resolvedSlot,
          userId: config.userId,
          durationMs,
          code: comp?.code ?? "",
        });
        config.events?.onSlotChange?.({
          slotId: resolvedSlot,
          userId: config.userId,
          action: "generate",
        });
      } catch (err) {
        setGenerationStage("error");
        const msg =
          err instanceof Error ? err.message : "Generation failed";
        addToast("error", msg);
        config.events?.onError?.({
          prompt,
          slotId: resolvedSlot,
          userId: config.userId,
          error: msg,
        });
        console.error("[OnClaw]", err);
      } finally {
        setIsGenerating(false);
        setStreamingCode("");
      }
    },
    [
      components,
      config,
      mode,
      generateServer,
      selectedSlot,
      saveComponent,
      addToast,
      rateLimiter,
    ]
  );

  // ─── Multi-slot generation ────────────────────────────

  const generateMultiSlot = useCallback(
    async (prompt: string) => {
      if (!config.multiSlot) {
        addToast("error", "Multi-slot operations not enabled");
        return;
      }

      const slotIds = Object.keys(mergedSlots);
      if (slotIds.length === 0) return;

      setIsGenerating(true);
      setGenerationStage("analyzing");
      const startTime = Date.now();
      let completed = 0;

      try {
        // Generate for each slot sequentially (to avoid rate limits)
        for (const slotId of slotIds) {
          const slotConfig = mergedSlots[slotId];
          const existing = components.find((c) => c.slotId === slotId);
          const endpoint = config.endpoint ?? "/api/onclaw/generate";

          setGenerationStage("generating");
          addToast(
            "info",
            `Generating ${slotConfig?.name ?? slotId}... (${completed + 1}/${slotIds.length})`
          );

          const result = await generateComponent(
            {
              prompt: `${prompt}\n\nGenerate ONLY for the "${slotConfig?.name ?? slotId}" section. ${slotConfig?.description ?? ""}`,
              slotId,
              slotContext: slotConfig,
              existingCode: existing?.code,
              appContext: config.appStyle,
            },
            endpoint
          );

          setGenerationStage("compiling");
          await saveComponent(slotId, result.code, prompt, existing);
          completed++;

          config.events?.onSlotChange?.({
            slotId,
            userId: config.userId,
            action: "generate",
          });
        }

        setGenerationStage("done");
        addToast(
          "success",
          `All ${slotIds.length} sections updated`
        );

        const durationMs = Date.now() - startTime;
        config.events?.onGenerateComplete?.({
          prompt,
          slotId: "multi",
          userId: config.userId,
          durationMs,
          code: "",
        });
      } catch (err) {
        setGenerationStage("error");
        const msg =
          err instanceof Error ? err.message : "Multi-slot generation failed";
        addToast("error", `${msg} (${completed}/${slotIds.length} completed)`);
        console.error("[OnClaw]", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [components, config, saveComponent, addToast]
  );

  // ─── Template application ─────────────────────────────

  const applyTemplate = useCallback(
    async (template: TemplateItem, slotId: string) => {
      const existing = components.find((c) => c.slotId === slotId);
      try {
        await saveComponent(
          slotId,
          template.code,
          `Template: ${template.name}`,
          existing
        );
        addToast("success", `Applied "${template.name}" template`);
        config.events?.onSlotChange?.({
          slotId,
          userId: config.userId,
          action: "generate",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to apply template";
        addToast("error", msg);
      }
    },
    [components, config, saveComponent, addToast]
  );

  // ─── Export component code ────────────────────────────

  const exportComponent = useCallback(
    (slotId: string): string | null => {
      const comp = components.find((c) => c.slotId === slotId);
      if (!comp) return null;

      return `// OnClaw Generated Component
// Slot: ${slotId}
// Prompt: "${comp.prompt}"
// Generated: ${new Date(comp.updatedAt).toISOString()}

import React from "react";

${comp.code}

export default Component;`;
    },
    [components]
  );

  const getSlotComponent = useCallback(
    (slotId: string) => {
      const comp = components.find((c) => c.slotId === slotId);
      if (!comp) return null;
      return compiledRef.current.get(comp.id) ?? null;
    },
    [components]
  );

  const removeComponent = useCallback(
    async (componentId: string) => {
      const comp = components.find((c) => c.id === componentId);
      compiledRef.current.delete(componentId);
      await store.delete(config.userId, componentId);
      setComponents((prev) => prev.filter((c) => c.id !== componentId));
      addToast("info", "Component removed");
      if (comp) {
        config.events?.onSlotChange?.({
          slotId: comp.slotId,
          userId: config.userId,
          action: "reset",
        });
      }
    },
    [config, components, store, addToast]
  );

  const rollback = useCallback(
    async (componentId: string) => {
      const comp = components.find((c) => c.id === componentId);
      if (!comp || comp.history.length === 0) {
        addToast("info", "Nothing to undo");
        return;
      }
      const prev = comp.history[comp.history.length - 1];
      const fn = compileComponent(prev.code, React, ctxBridge);
      if (!fn) return;

      const updated: UserComponent = {
        ...comp,
        code: prev.code,
        prompt: prev.prompt,
        updatedAt: Date.now(),
        history: comp.history.slice(0, -1),
      };

      compiledRef.current.set(updated.id, fn);
      await store.save(updated);
      setComponents((p) =>
        p.map((c) => (c.id === updated.id ? updated : c))
      );
      addToast("success", "Reverted to previous version");
      config.events?.onSlotChange?.({
        slotId: comp.slotId,
        userId: config.userId,
        action: "rollback",
      });
    },
    [components, store, addToast, config]
  );

  const resetSlot = useCallback(
    async (slotId: string) => {
      const comp = components.find((c) => c.slotId === slotId);
      if (!comp) return;
      compiledRef.current.delete(comp.id);
      await store.delete(config.userId, comp.id);
      setComponents((prev) => prev.filter((c) => c.id !== comp.id));
      // Clear conversation history for this slot
      conversationHistoryRef.current.delete(slotId);
      addToast("info", "Reset to default");
      config.events?.onSlotChange?.({
        slotId,
        userId: config.userId,
        action: "reset",
      });
    },
    [components, config, store, addToast]
  );

  // ─── Create dynamic slot ───────────────────────────────

  const createSlot = useCallback(
    (name: string, description?: string): string => {
      const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;
      setDynamicSlots((prev) => ({
        ...prev,
        [id]: { name, description: description ?? `Custom: ${name}` },
      }));
      return id;
    },
    []
  );

  const dynamicSlotIds = useMemo(
    () => Object.keys(dynamicSlots),
    [dynamicSlots]
  );

  // ─── Share component ─────────────────────────────────

  const shareComponent = useCallback(
    async (slotId: string): Promise<string | null> => {
      const comp = components.find((c) => c.slotId === slotId);
      if (!comp) return null;

      const url = await generateShareUrl(
        {
          code: comp.code,
          prompt: comp.prompt,
          slotId,
          slotConfig: mergedSlots[slotId],
          themeOverrides: config.themeOverrides,
          createdAt: comp.createdAt,
        },
        config.shareEndpoint
      );

      navigator.clipboard?.writeText(url).catch(() => {});
      addToast("success", "Share link copied to clipboard");
      return url;
    },
    [components, config, addToast]
  );

  // ─── Import shared component ──────────────────────────

  const importSharedComponent = useCallback(
    async (slotId: string, code: string, prompt: string) => {
      const existing = components.find((c) => c.slotId === slotId);
      await saveComponent(slotId, code, prompt, existing);
      addToast("success", "Component imported");
    },
    [components, saveComponent, addToast]
  );

  // ─── Style overrides ─────────────────────────────────

  const applyStyleOverrides = useCallback(
    (overrides: Record<string, string>) => {
      setDynamicStyleOverrides(overrides);
    },
    []
  );

  const value: OnClawContextValue = {
    userId: config.userId,
    config,
    components,
    isOpen,
    isGenerating,
    generationStage,
    selectedSlot,
    mode,
    hasServerSupport,
    lastServerMutation,
    slots: mergedSlots,
    toasts,
    streamingCode,
    conversationHistory,
    highlightedSlots,
    templates: config.templates ?? [],
    rateLimitRemaining,
    open,
    close,
    generate,
    generateMultiSlot,
    applyTemplate,
    getSlotComponent,
    removeComponent,
    rollback,
    resetSlot,
    exportComponent,
    shareComponent,
    importSharedComponent,
    createSlot,
    dynamicSlotIds,
    dismissToast,
    setHighlightedSlots,
    applyStyleOverrides,
    styleOverrides: dynamicStyleOverrides,
    ctxBridge,
  };

  return (
    <OnClawContext.Provider value={value}>
      <div
        className="onclaw-root"
        style={theme as React.CSSProperties}
      >
        {children}
        {mounted && (
          <>
            <CommandBar />
            {!config.hideTrigger && <FloatingTrigger />}
            <Toast />
          </>
        )}
      </div>
    </OnClawContext.Provider>
  );
}
