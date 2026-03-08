/** A user-generated component stored per user per slot */
export interface UserComponent {
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

export interface ComponentVersion {
  code: string;
  prompt: string;
  timestamp: number;
}

/** Persistence adapter interface */
export interface StoreAdapter {
  /** Load all components for a user */
  load(userId: string): Promise<UserComponent[]>;
  /** Save a component */
  save(component: UserComponent): Promise<void>;
  /** Delete a component */
  delete(userId: string, componentId: string): Promise<void>;
}

// ─── Event hooks / analytics ────────────────────────────

export interface OnClawEvents {
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

// ─── Rate limiting ──────────────────────────────────────

export interface RateLimitConfig {
  /** Max generations per window */
  maxGenerations: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Custom message when rate limited */
  message?: string;
}

// ─── Template gallery ───────────────────────────────────

export interface TemplateItem {
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

// ─── Main OnClaw configuration ─────────────────────────

export interface OnClawConfig {
  /** User identifier — your app provides this */
  userId: string;

  /**
   * Generation endpoint URL.
   * Your backend proxies to any LLM. Use `createOnClawHandler` from "onclaw/next" for a one-liner.
   * Receives: { messages, max_tokens }
   * Returns: { choices: [{ message: { content } }] }
   * @default "/api/onclaw/generate"
   */
  endpoint?: string;

  /**
   * Streaming generation endpoint.
   * If set, OnClaw will use SSE streaming for real-time token display.
   * Should return `text/event-stream` with `data: {"token": "..."}` events.
   * Use `createOnClawHandler` with `streaming: true` from "onclaw/next".
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
  themeOverrides?: Partial<OnClawTheme>;

  /** Hide the floating trigger button */
  hideTrigger?: boolean;

  /** Custom keyboard shortcut (default: mod+k) */
  shortcut?: string;

  /** Event hooks for analytics, moderation, logging */
  events?: OnClawEvents;

  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;

  /** Pre-built template gallery items */
  templates?: TemplateItem[];

  /** Enable multi-slot operations ("change everything") */
  multiSlot?: boolean;

  /** Plugins for custom transforms, validators, and wrappers */
  plugins?: OnClawPlugin[];

  /** Run generated components in iframe sandbox for security */
  sandbox?: boolean;

  /** Enable share/export permalink functionality */
  shareEndpoint?: string;

  /** Enable smart prompt refinement (auto-enhance vague prompts) */
  smartPrompts?: boolean;
}

export interface SlotConfig {
  /** Human-readable name for the AI */
  name: string;
  /** Description of what this slot area is for */
  description?: string;
  /** Props available to generated components */
  availableProps?: Record<string, string>;
}

export interface OnClawTheme {
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

export interface GenerateRequest {
  prompt: string;
  slotId?: string;
  slotContext?: SlotConfig;
  existingCode?: string;
  appContext?: string;
  /** Conversation history for iterative refinement */
  conversationHistory?: ConversationMessage[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateResponse {
  code: string;
  explanation?: string;
}

// ─── Plugin system ──────────────────────────────────────

export interface OnClawPlugin {
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
  wrapComponent?: (
    Component: React.ComponentType<Record<string, unknown>>,
    slotId: string
  ) => React.ComponentType<Record<string, unknown>>;
}

// ─── Share / permalink ──────────────────────────────────

export interface SharePayload {
  /** The generated code */
  code: string;
  /** Original prompt */
  prompt: string;
  /** Slot it was designed for */
  slotId: string;
  /** Slot config */
  slotConfig?: SlotConfig;
  /** Theme overrides at time of creation */
  themeOverrides?: Partial<OnClawTheme>;
  /** Timestamp */
  createdAt: number;
}

// ─── Admin analytics ────────────────────────────────────

export interface OnClawAnalytics {
  /** Total generations */
  totalGenerations: number;
  /** Generations per slot */
  perSlot: Record<string, number>;
  /** Recent prompts */
  recentPrompts: { prompt: string; slotId: string; timestamp: number }[];
  /** Error count */
  errors: number;
  /** Average generation time (ms) */
  avgDurationMs: number;
  /** Template usage count */
  templateUsage: number;
}
