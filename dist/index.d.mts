import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1, { ReactNode } from 'react';

/** A user-generated component stored per user per slot */
interface UserComponent {
    /** Unique component ID */
    id: string;
    /** Which slot this component belongs to */
    slotId: string;
    /** Which user created this */
    userId: string;
    /** The prompt that generated this component */
    prompt: string;
    /** Generated React code as a string (React.createElement based) */
    code: string;
    /** Compiled render function (runtime only, not persisted) */
    render?: (props: Record<string, unknown>) => React.ReactNode;
    /** Creation timestamp */
    createdAt: number;
    /** Last update timestamp */
    updatedAt: number;
    /** Version history for rollback */
    history: ComponentVersion[];
}
interface ComponentVersion {
    code: string;
    prompt: string;
    timestamp: number;
}
/** Persistence adapter interface */
interface StoreAdapter {
    /** Load all components for a user */
    load(userId: string): Promise<UserComponent[]>;
    /** Save a component */
    save(component: UserComponent): Promise<void>;
    /** Delete a component */
    delete(userId: string, componentId: string): Promise<void>;
}
interface ClawKitEvents {
    /** Fired when a generation starts */
    onGenerateStart?: (event: {
        prompt: string;
        slotId: string;
        userId: string;
    }) => void;
    /** Fired when a generation completes successfully */
    onGenerateComplete?: (event: {
        prompt: string;
        slotId: string;
        userId: string;
        durationMs: number;
        code: string;
    }) => void;
    /** Fired on generation error */
    onError?: (event: {
        prompt: string;
        slotId: string;
        userId: string;
        error: string;
    }) => void;
    /** Fired when a slot's content changes (generate, rollback, reset) */
    onSlotChange?: (event: {
        slotId: string;
        userId: string;
        action: "generate" | "rollback" | "reset";
    }) => void;
    /** Content moderation hook — return false to block the generation */
    onBeforeGenerate?: (event: {
        prompt: string;
        slotId: string;
        userId: string;
    }) => boolean | Promise<boolean>;
}
interface RateLimitConfig {
    /** Max generations per window */
    maxGenerations: number;
    /** Window duration in milliseconds */
    windowMs: number;
    /** Custom message when rate limited */
    message?: string;
}
interface TemplateItem {
    /** Unique template ID */
    id: string;
    /** Display name */
    name: string;
    /** Category (hero, cta, sidebar, nav, features, etc.) */
    category: string;
    /** Description */
    description?: string;
    /** Preview thumbnail URL (optional) */
    thumbnail?: string;
    /** The component code (React.createElement based) */
    code: string;
    /** Tags for search */
    tags?: string[];
}
interface ClawKitConfig {
    /** User identifier — your app provides this */
    userId: string;
    /**
     * Generation endpoint URL.
     * Your backend proxies to any LLM. Use `createClawKitHandler` from "clawkit/next" for a one-liner.
     * Receives: { messages, max_tokens }
     * Returns: { choices: [{ message: { content } }] }
     * @default "/api/clawkit/generate"
     */
    endpoint?: string;
    /**
     * Streaming generation endpoint.
     * If set, ClawKit will use SSE streaming for real-time token display.
     * Should return `text/event-stream` with `data: {"token": "..."}` events.
     * Use `createClawKitHandler` with `streaming: true` from "clawkit/next".
     */
    streamEndpoint?: string;
    /** Server mutation endpoint (enables server-side file changes) */
    serverUrl?: string;
    /** Persistence adapter (defaults to localStorage) */
    store?: StoreAdapter;
    /** Available slots and their context */
    slots?: Record<string, SlotConfig>;
    /** Theme mode override (defaults to auto-detect) */
    theme?: "light" | "dark" | "auto";
    /** Custom theme variable overrides */
    themeOverrides?: Partial<ClawKitTheme>;
    /** Hide the floating trigger button */
    hideTrigger?: boolean;
    /** Custom keyboard shortcut (default: mod+k) */
    shortcut?: string;
    /** Event hooks for analytics, moderation, logging */
    events?: ClawKitEvents;
    /** Rate limiting configuration */
    rateLimit?: RateLimitConfig;
    /** Pre-built template gallery items */
    templates?: TemplateItem[];
    /** Enable multi-slot operations ("change everything") */
    multiSlot?: boolean;
    /** Plugins for custom transforms, validators, and wrappers */
    plugins?: ClawKitPlugin[];
    /** Run generated components in iframe sandbox for security */
    sandbox?: boolean;
    /** Enable share/export permalink functionality */
    shareEndpoint?: string;
    /** Enable smart prompt refinement (auto-enhance vague prompts) */
    smartPrompts?: boolean;
}
interface SlotConfig {
    /** Human-readable name for the AI */
    name: string;
    /** Description of what this slot area is for */
    description?: string;
    /** Props available to generated components */
    availableProps?: Record<string, string>;
}
interface ClawKitTheme {
    "--ck-bg": string;
    "--ck-bg-secondary": string;
    "--ck-bg-hover": string;
    "--ck-border": string;
    "--ck-text": string;
    "--ck-text-muted": string;
    "--ck-accent": string;
    "--ck-accent-text": string;
    "--ck-radius": string;
    "--ck-shadow": string;
    "--ck-font": string;
}
interface GenerateRequest {
    prompt: string;
    slotId?: string;
    slotContext?: SlotConfig;
    existingCode?: string;
    appContext?: string;
    /** Conversation history for iterative refinement */
    conversationHistory?: ConversationMessage[];
}
interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
}
interface GenerateResponse {
    code: string;
    explanation?: string;
}
interface ClawKitPlugin {
    /** Unique plugin name */
    name: string;
    /** Transform the prompt before sending to LLM */
    beforeGenerate?: (ctx: {
        prompt: string;
        slotId: string;
        slotConfig?: SlotConfig;
        existingCode?: string;
    }) => string | Promise<string>;
    /** Transform the generated code before compiling */
    afterGenerate?: (ctx: {
        code: string;
        prompt: string;
        slotId: string;
    }) => string | Promise<string>;
    /** Validate code — return error string to reject, null to accept */
    validate?: (ctx: {
        code: string;
        slotId: string;
    }) => string | null | Promise<string | null>;
    /** Custom rendering wrapper — wraps the compiled component */
    wrapComponent?: (Component: React.ComponentType<Record<string, unknown>>, slotId: string) => React.ComponentType<Record<string, unknown>>;
}
interface SharePayload {
    /** The generated code */
    code: string;
    /** Original prompt */
    prompt: string;
    /** Slot it was designed for */
    slotId: string;
    /** Slot config */
    slotConfig?: SlotConfig;
    /** Theme overrides at time of creation */
    themeOverrides?: Partial<ClawKitTheme>;
    /** Timestamp */
    createdAt: number;
}
interface ClawKitAnalytics {
    /** Total generations */
    totalGenerations: number;
    /** Generations per slot */
    perSlot: Record<string, number>;
    /** Recent prompts */
    recentPrompts: {
        prompt: string;
        slotId: string;
        timestamp: number;
    }[];
    /** Error count */
    errors: number;
    /** Average generation time (ms) */
    avgDurationMs: number;
    /** Template usage count */
    templateUsage: number;
}

type MutationMode = "client" | "server";
type GenerationStage = "idle" | "analyzing" | "generating" | "streaming" | "compiling" | "done" | "error";
interface ServerMutationResult {
    id: string;
    files: {
        path: string;
        action: string;
    }[];
    needsRebuild: boolean;
    status: string;
    clientCode?: string;
}
interface ToastMessage {
    id: string;
    type: "success" | "error" | "info";
    message: string;
}
interface ClawKitContextValue {
    userId: string;
    config: ClawKitConfig;
    components: UserComponent[];
    isOpen: boolean;
    isGenerating: boolean;
    generationStage: GenerationStage;
    selectedSlot: string | null;
    mode: MutationMode;
    hasServerSupport: boolean;
    lastServerMutation: ServerMutationResult | null;
    slots: Record<string, SlotConfig>;
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
    getSlotComponent: (slotId: string) => ((props: Record<string, unknown>) => React$1.ReactNode) | null;
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
declare function useClawKit(): ClawKitContextValue;
declare function ClawKitProvider({ children, ...config }: ClawKitConfig & {
    children: React$1.ReactNode;
}): react_jsx_runtime.JSX.Element;

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
    style?: React$1.CSSProperties;
    /** Disable transition animation */
    noTransition?: boolean;
}
declare function Slot({ id, children, props: slotProps, editable, className, style, noTransition, }: SlotProps): react_jsx_runtime.JSX.Element;

/**
 * Built-in admin analytics panel.
 * Shows generation stats, popular slots, recent prompts.
 *
 * Usage: <ClawKitAdmin />
 * Must be inside a <ClawKitProvider>.
 */
declare function ClawKitAdmin({ style, className, }: {
    style?: React$1.CSSProperties;
    className?: string;
}): react_jsx_runtime.JSX.Element;

/**
 * Renders generated code inside a sandboxed iframe for security isolation.
 * The iframe has no access to the parent page's DOM, cookies, or JS context.
 */
declare function SandboxedComponent({ code, props, theme, height, onError, }: {
    code: string;
    props?: Record<string, unknown>;
    theme?: Record<string, string>;
    height?: string | number;
    onError?: (error: string) => void;
}): react_jsx_runtime.JSX.Element;

/**
 * Simple line-based diff viewer for generated code.
 * Shows before/after comparison with color-coded lines.
 */
declare function DiffView({ oldCode, newCode, maxHeight, }: {
    oldCode: string;
    newCode: string;
    maxHeight?: number;
}): react_jsx_runtime.JSX.Element | null;

declare function StyleEditor({ onApply, currentOverrides, }: {
    onApply: (overrides: Record<string, string>) => void;
    currentOverrides?: Record<string, string>;
}): react_jsx_runtime.JSX.Element;

declare class LocalStoreAdapter implements StoreAdapter {
    load(userId: string): Promise<UserComponent[]>;
    save(component: UserComponent): Promise<void>;
    delete(userId: string, componentId: string): Promise<void>;
}

/** Remote persistence adapter — backs to any API */
declare class APIStoreAdapter implements StoreAdapter {
    private baseUrl;
    private headers;
    constructor(baseUrl: string, headers?: Record<string, string>);
    load(userId: string): Promise<UserComponent[]>;
    save(component: UserComponent): Promise<void>;
    delete(userId: string, componentId: string): Promise<void>;
}

/**
 * Context Bridge — Client-side proxy for the server-side context API.
 *
 * Generated components call `ctx.queries.getDeals()` which gets proxied
 * to `/api/clawkit/context` on the server, executing the real query functions.
 */
interface ContextBridgeConfig {
    /** Context API endpoint (default: /api/clawkit/context) */
    endpoint?: string;
    /** Additional headers (e.g., auth tokens) */
    headers?: Record<string, string>;
    /** Cache TTL in ms (default: 30000 — 30 seconds) */
    cacheTtlMs?: number;
}
/**
 * Creates a client-side context proxy that routes calls to the server.
 * Generated components use this like: `const deals = await ctx.queries.getDeals({ stage: "won" })`
 */
declare function createContextBridge(config?: ContextBridgeConfig): {
    queries: Record<string, (...args: any[]) => Promise<any>>;
    actions: Record<string, (...args: any[]) => Promise<any>>;
    /** Clear the query cache */
    clearCache(): void;
};

/**
 * Encode a share payload into a URL-safe string.
 * Uses base64 encoding of compressed JSON.
 */
declare function encodeSharePayload(payload: SharePayload): string;
/**
 * Decode a share payload from a URL-safe string.
 */
declare function decodeSharePayload(encoded: string): SharePayload | null;
/**
 * Check if the current URL contains a shared component.
 */
declare function parseShareFromUrl(): SharePayload | null;

interface PromptSuggestion {
    text: string;
    category: "style" | "content" | "layout" | "interactive";
    icon: string;
}
/**
 * Context-aware prompt suggestions based on slot type and keywords.
 */
declare function getSuggestions(slotId: string | null, slotConfig: SlotConfig | undefined, input: string, hasExisting: boolean): PromptSuggestion[];

/**
 * Auto-enhance vague prompts with contextual detail.
 * Makes short prompts more specific so the LLM produces better output.
 */
declare function refinePrompt(prompt: string, slotId: string, slotConfig?: SlotConfig, hasExisting?: boolean): string;

export { APIStoreAdapter, ClawKitAdmin, type ClawKitAnalytics, type ClawKitConfig, type ClawKitEvents, type ClawKitPlugin, ClawKitProvider, type ClawKitTheme, type ComponentVersion, type ConversationMessage, DiffView, type GenerateRequest, type GenerateResponse, type GenerationStage, LocalStoreAdapter, type MutationMode, type RateLimitConfig, SandboxedComponent, type ServerMutationResult, type SharePayload, Slot, type SlotConfig, type StoreAdapter, StyleEditor, type TemplateItem, type UserComponent, createContextBridge, decodeSharePayload, encodeSharePayload, getSuggestions, parseShareFromUrl, refinePrompt, useClawKit };
