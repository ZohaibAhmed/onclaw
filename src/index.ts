// Core components
export { ClawKitProvider, useClawKit } from "./components/provider";
export { Slot } from "./components/slot";
export { ClawKitAdmin } from "./components/admin";
export { SandboxedComponent } from "./components/sandbox";
export { DiffView } from "./components/diff-view";
export { StyleEditor } from "./components/style-editor";

// Store adapters
export { LocalStoreAdapter } from "./store/local";
export { APIStoreAdapter } from "./store/api";

// Context bridge
export { createContextBridge } from "./lib/context-bridge";

// Utilities
export { encodeSharePayload, decodeSharePayload, parseShareFromUrl } from "./lib/share";
export { getSuggestions } from "./lib/suggestions";
export { refinePrompt } from "./lib/smart-prompt";

// Types
export type {
  ClawKitConfig,
  ClawKitTheme,
  ClawKitEvents,
  ClawKitPlugin,
  ClawKitAnalytics,
  RateLimitConfig,
  TemplateItem,
  SharePayload,
  UserComponent,
  StoreAdapter,
  SlotConfig,
  GenerateRequest,
  GenerateResponse,
  ComponentVersion,
  ConversationMessage,
} from "./types";

// Re-export context types
export type {
  MutationMode,
  GenerationStage,
  ServerMutationResult,
} from "./components/provider";
