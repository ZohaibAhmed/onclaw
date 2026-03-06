// Server-side exports (Node.js only — don't import in client bundles)
export { generateServerMutation, SERVER_SYSTEM_PROMPT } from "./lib/server-engine";
export { MutationManager } from "./lib/mutation-manager";
export type { ComponentScope, MutationManagerConfig } from "./lib/mutation-manager";
export type {
  ServerMutation,
  FileChange,
  ServerEngineConfig,
} from "./lib/server-engine";
