interface SlotConfig {
    /** Human-readable name for the AI */
    name: string;
    /** Description of what this slot area is for */
    description?: string;
    /** Props available to generated components */
    availableProps?: Record<string, string>;
}

/**
 * Server-side mutation engine.
 * This runs on your backend — generates real files, API routes, server components.
 * NOT bundled into the client; import from "clawkit/server".
 */

interface ServerMutation {
    id: string;
    userId: string;
    prompt: string;
    /** Files to create or modify */
    files: FileChange[];
    /** Client-renderable component code for instant preview */
    clientCode?: string;
    /** Whether this needs a rebuild/redeploy */
    needsRebuild: boolean;
    createdAt: number;
    status: "pending" | "applied" | "rolled_back" | "failed";
    error?: string;
}
interface FileChange {
    path: string;
    content: string;
    action: "create" | "modify" | "delete";
    /** Original content for rollback */
    original?: string;
}
interface ServerEngineConfig {
    /** Root directory of the Next.js app */
    appRoot: string;
    /** LLM endpoint for code generation */
    llmEndpoint: string;
    llmApiKey?: string;
    /** Where to store per-user server components */
    userComponentsDir?: string;
    /** Callback after files are written (trigger rebuild, deploy, etc.) */
    onMutationApplied?: (mutation: ServerMutation) => Promise<void>;
    /** Callback to persist mutations (DB, file, etc.) */
    onMutationSaved?: (mutation: ServerMutation) => Promise<void>;
}
declare const SERVER_SYSTEM_PROMPT = "You are a Next.js code generator for ClawKit server-side mutations.\nYou generate real, production-quality Next.js code that will be written to the filesystem.\nYou ALSO generate a client-renderable preview version for instant display.\n\nRules:\n- Output a JSON object with two fields:\n  \"files\": array of file changes [{\"path\": \"relative/path.tsx\", \"content\": \"...\", \"action\": \"create|modify\"}]\n  \"clientCode\": a self-contained component using ONLY React.createElement (NO JSX, NO imports, NO exports). This version renders immediately in the browser. Use inline styles, not className/Tailwind. Use CSS variables: var(--ck-bg), var(--ck-text), var(--ck-accent), var(--ck-border), var(--ck-radius). Assign the component to `const Component = ...`.\n- The files array contains the real Next.js code (with imports, JSX, Tailwind, etc.)\n- The clientCode is a simplified preview of the same component for instant rendering\n- Paths are relative to the app root\n- For new API routes, use app/api/[name]/route.ts pattern\n- For new server components, use app/components/[user-namespace]/[name].tsx\n- NEVER modify existing files like page.tsx, layout.tsx, or any file that already exists\n- ONLY create NEW files in app/components/ or app/api/ directories\n- If asked to modify something on the page, create a NEW component that replaces the slot content\n- Use TypeScript, modern Next.js patterns (App Router, Server Components, Server Actions)\n- Do NOT use external packages unless they're standard Next.js deps (next, react)\n- Keep components self-contained\n- Output ONLY the JSON object, no markdown, no explanation\n\nExample output:\n{\"files\":[{\"path\":\"app/components/sidebar/Stats.tsx\",\"content\":\"'use client';\\nimport { useState } from 'react';\\nexport default function Stats() { ... }\",\"action\":\"create\"}],\"clientCode\":\"const Component = (props) => { const [count, setCount] = React.useState(0); return React.createElement(\\\"div\\\", { style: { padding: \\\"1rem\\\", background: \\\"var(--ck-bg)\\\", borderRadius: \\\"var(--ck-radius)\\\", color: \\\"var(--ck-text)\\\" } }, \\\"Hello\\\"); };\"}";
declare function generateServerMutation(prompt: string, config: ServerEngineConfig, context?: {
    slotId?: string;
    slotConfig?: SlotConfig;
    existingFiles?: {
        path: string;
        content: string;
    }[];
}): Promise<ServerMutation>;

/**
 * Mutation Manager — applies, tracks, and rolls back server-side file changes.
 * Runs on the server only.
 *
 * Multi-user safe: each user's generated files are namespaced to their own directory.
 * Shared/promoted components live in a separate shared directory.
 */

type ComponentScope = "personal" | "team" | "global";
interface MutationManagerConfig extends ServerEngineConfig {
    /** Base directory for generated files (default: src/clawkit/generated) */
    generatedDir?: string;
    /** Custom protected file patterns (merged with defaults) */
    protectedPatterns?: RegExp[];
    /** Max file size per mutation in bytes (default: 50KB) */
    maxFileSize?: number;
}
declare class MutationManager {
    private config;
    private mutations;
    private appRoot;
    private generatedDir;
    private maxFileSize;
    private extraProtected;
    constructor(config: MutationManagerConfig);
    init(): Promise<void>;
    /** Files that should never be modified by mutations */
    private static PROTECTED_PATTERNS;
    private isProtected;
    /**
     * Resolve a file path for a specific user.
     * All paths are forced into the user's namespace under the generated directory.
     * e.g., "components/DealChart.tsx" → "src/clawkit/generated/user-123/components/DealChart.tsx"
     */
    private resolveUserPath;
    /**
     * Resolve a file path for shared/promoted components.
     */
    private resolveSharedPath;
    /**
     * Validate that a resolved path doesn't escape the generated directory.
     * Prevents path traversal attacks.
     */
    private isPathSafe;
    /** Apply a mutation — write files to disk, namespaced to the user */
    apply(mutation: ServerMutation): Promise<ServerMutation>;
    /**
     * Promote a user's generated component to shared scope.
     * Copies the file from user namespace to shared namespace.
     */
    promote(mutationId: string, approvedBy: string): Promise<{
        sharedPaths: string[];
    } | null>;
    /** Roll back a mutation */
    rollback(mutationId: string): Promise<boolean>;
    /** Get all mutations for a user */
    getUserMutations(userId: string): ServerMutation[];
    /** Get all active mutations */
    getActiveMutations(): ServerMutation[];
    /** Get shared (promoted) mutations */
    getSharedMutations(): ServerMutation[];
    /**
     * List all generated files for a user.
     * Returns paths relative to appRoot.
     */
    listUserFiles(userId: string): Promise<string[]>;
    /**
     * List shared generated files.
     */
    listSharedFiles(): Promise<string[]>;
    private rollbackFile;
    private saveMutations;
}

export { type ComponentScope, type FileChange, MutationManager, type MutationManagerConfig, SERVER_SYSTEM_PROMPT, type ServerEngineConfig, type ServerMutation, generateServerMutation };
