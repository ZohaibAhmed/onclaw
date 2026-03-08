/**
 * Mutation Manager — applies, tracks, and rolls back server-side file changes.
 * Runs on the server only.
 *
 * Multi-user safe: each user's generated files are namespaced to their own directory.
 * Shared/promoted components live in a separate shared directory.
 */

import { readFile, writeFile, mkdir, unlink, rename } from "fs/promises";
import { dirname, join, normalize, relative } from "path";
import { existsSync } from "fs";
import type { ServerMutation, FileChange, ServerEngineConfig } from "./server-engine";

const MUTATIONS_FILE = ".onclaw/mutations.json";
const GENERATED_DIR = "src/onclaw/generated";
const LOCK_TIMEOUT_MS = 10_000;

// ─── File Lock (in-process) ─────────────────────────────

const locks = new Map<string, { resolve: () => void; promise: Promise<void>; timestamp: number }>();

async function acquireLock(path: string): Promise<() => void> {
  const key = normalize(path);

  // Wait for existing lock (with timeout)
  while (locks.has(key)) {
    const existing = locks.get(key)!;
    // Expire stale locks
    if (Date.now() - existing.timestamp > LOCK_TIMEOUT_MS) {
      existing.resolve();
      locks.delete(key);
      break;
    }
    await existing.promise;
  }

  // Acquire
  let releaseFn!: () => void;
  const promise = new Promise<void>((resolve) => {
    releaseFn = resolve;
  });
  locks.set(key, { resolve: releaseFn, promise, timestamp: Date.now() });

  return () => {
    locks.delete(key);
    releaseFn();
  };
}

// ─── Types ──────────────────────────────────────────────

export type ComponentScope = "personal" | "team" | "global";

export interface MutationManagerConfig extends ServerEngineConfig {
  /** Base directory for generated files (default: src/onclaw/generated) */
  generatedDir?: string;
  /** Custom protected file patterns (merged with defaults) */
  protectedPatterns?: RegExp[];
  /** Max file size per mutation in bytes (default: 50KB) */
  maxFileSize?: number;
}

// ─── Mutation Manager ───────────────────────────────────

export class MutationManager {
  private mutations: ServerMutation[] = [];
  private appRoot: string;
  private generatedDir: string;
  private maxFileSize: number;
  private extraProtected: RegExp[];

  constructor(private config: MutationManagerConfig) {
    this.appRoot = config.appRoot;
    this.generatedDir = config.generatedDir || GENERATED_DIR;
    this.maxFileSize = config.maxFileSize || 50 * 1024;
    this.extraProtected = config.protectedPatterns || [];
  }

  async init() {
    const mutFile = join(this.appRoot, MUTATIONS_FILE);
    if (existsSync(mutFile)) {
      const raw = await readFile(mutFile, "utf-8");
      this.mutations = JSON.parse(raw);
    }
    // Ensure generated directory structure exists
    await mkdir(join(this.appRoot, this.generatedDir, "shared"), { recursive: true });
  }

  // ─── Path Safety ────────────────────────────────────

  /** Files that should never be modified by mutations */
  private static PROTECTED_PATTERNS = [
    /^app\/page\./,
    /^app\/layout\./,
    /^app\/globals\./,
    /^src\/app\/page\./,
    /^src\/app\/layout\./,
    /^package\.json$/,
    /^tsconfig/,
    /^next\.config/,
    /^\.env/,
    /^\.onclaw\/project\.json$/,
  ];

  private isProtected(path: string): boolean {
    const allPatterns = [...MutationManager.PROTECTED_PATTERNS, ...this.extraProtected];
    return allPatterns.some((p) => p.test(path));
  }

  /**
   * Resolve a file path for a specific user.
   * All paths are forced into the user's namespace under the generated directory.
   * e.g., "components/DealChart.tsx" → "src/onclaw/generated/user-123/components/DealChart.tsx"
   */
  private resolveUserPath(filePath: string, userId: string): string {
    // Sanitize userId — only allow alphanumeric, dash, underscore
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const userDir = join(this.generatedDir, safeUserId);

    // If the path is already inside the generated dir, extract the relative part
    const normalizedPath = normalize(filePath);
    if (normalizedPath.startsWith(this.generatedDir)) {
      const relativePart = relative(this.generatedDir, normalizedPath);
      // Strip any existing user prefix if re-generating
      const parts = relativePart.split("/");
      if (parts[0] === safeUserId || parts[0] === "shared") {
        return normalizedPath; // Already correctly namespaced
      }
      return join(userDir, relativePart);
    }

    // External path — force into user namespace
    return join(userDir, filePath);
  }

  /**
   * Resolve a file path for shared/promoted components.
   */
  private resolveSharedPath(filePath: string): string {
    const sharedDir = join(this.generatedDir, "shared");
    const normalizedPath = normalize(filePath);
    if (normalizedPath.startsWith(sharedDir)) return normalizedPath;
    if (normalizedPath.startsWith(this.generatedDir)) {
      const relativePart = relative(this.generatedDir, normalizedPath);
      const parts = relativePart.split("/");
      // Strip user prefix
      if (parts.length > 1 && parts[0] !== "shared") {
        return join(sharedDir, ...parts.slice(1));
      }
      return join(sharedDir, relativePart);
    }
    return join(sharedDir, filePath);
  }

  /**
   * Validate that a resolved path doesn't escape the generated directory.
   * Prevents path traversal attacks.
   */
  private isPathSafe(resolvedPath: string): boolean {
    const fullResolved = join(this.appRoot, resolvedPath);
    const fullGenDir = join(this.appRoot, this.generatedDir);
    return normalize(fullResolved).startsWith(normalize(fullGenDir));
  }

  // ─── Apply Mutation ─────────────────────────────────

  /** Apply a mutation — write files to disk, namespaced to the user */
  async apply(mutation: ServerMutation): Promise<ServerMutation> {
    const userId = mutation.userId;

    // Rewrite all file paths to user namespace
    mutation.files = mutation.files.map((f) => ({
      ...f,
      path: this.resolveUserPath(f.path, userId),
    }));

    // Filter out protected files and validate paths
    mutation.files = mutation.files.filter((f) => {
      if (this.isProtected(f.path)) {
        console.warn(`[OnClaw] Blocked modification of protected file: ${f.path}`);
        return false;
      }
      if (!this.isPathSafe(f.path)) {
        console.warn(`[OnClaw] Blocked path traversal attempt: ${f.path}`);
        return false;
      }
      if (f.content && f.content.length > this.maxFileSize) {
        console.warn(`[OnClaw] File too large (${f.content.length} bytes): ${f.path}`);
        return false;
      }
      return true;
    });

    if (mutation.files.length === 0) {
      mutation.status = "failed";
      mutation.error = "No valid files to write";
      return mutation;
    }

    // Acquire locks on all files
    const releaseFns: (() => void)[] = [];
    try {
      for (const file of mutation.files) {
        const release = await acquireLock(join(this.appRoot, file.path));
        releaseFns.push(release);
      }

      const applied: FileChange[] = [];

      try {
        for (const file of mutation.files) {
          const fullPath = join(this.appRoot, file.path);

          // Store original for rollback
          if (existsSync(fullPath)) {
            file.original = await readFile(fullPath, "utf-8");
          }

          if (file.action === "delete") {
            if (existsSync(fullPath)) {
              const trashPath = join(this.appRoot, ".onclaw", "trash", file.path);
              await mkdir(dirname(trashPath), { recursive: true });
              await rename(fullPath, trashPath);
            }
          } else {
            await mkdir(dirname(fullPath), { recursive: true });
            await writeFile(fullPath, file.content, "utf-8");
          }

          applied.push(file);
        }

        mutation.status = "applied";
      } catch (err) {
        // Rollback on failure
        for (const file of applied) {
          try {
            await this.rollbackFile(file);
          } catch {
            // Best effort
          }
        }
        mutation.status = "failed";
        mutation.error = err instanceof Error ? err.message : String(err);
      }
    } finally {
      // Release all locks
      for (const release of releaseFns) {
        release();
      }
    }

    // Persist mutation record
    this.mutations.push(mutation);
    await this.saveMutations();

    // Notify
    if (mutation.status === "applied" && this.config.onMutationApplied) {
      await this.config.onMutationApplied(mutation);
    }
    if (this.config.onMutationSaved) {
      await this.config.onMutationSaved(mutation);
    }

    return mutation;
  }

  // ─── Promote / Share ────────────────────────────────

  /**
   * Promote a user's generated component to shared scope.
   * Copies the file from user namespace to shared namespace.
   */
  async promote(
    mutationId: string,
    approvedBy: string
  ): Promise<{ sharedPaths: string[] } | null> {
    const mutation = this.mutations.find((m) => m.id === mutationId);
    if (!mutation || mutation.status !== "applied") return null;

    const sharedPaths: string[] = [];

    for (const file of mutation.files) {
      if (file.action === "delete") continue;

      const sharedPath = this.resolveSharedPath(file.path);
      const fullSource = join(this.appRoot, file.path);
      const fullDest = join(this.appRoot, sharedPath);

      if (!existsSync(fullSource)) continue;

      const release = await acquireLock(fullDest);
      try {
        const content = await readFile(fullSource, "utf-8");
        await mkdir(dirname(fullDest), { recursive: true });
        await writeFile(fullDest, content, "utf-8");
        sharedPaths.push(sharedPath);
      } finally {
        release();
      }
    }

    // Record the promotion
    const promotionRecord: ServerMutation = {
      id: `promo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      userId: approvedBy,
      prompt: `Promoted mutation ${mutationId} to shared`,
      files: sharedPaths.map((p) => ({
        path: p,
        content: "", // Content already written
        action: "create" as const,
      })),
      clientCode: mutation.clientCode,
      needsRebuild: true,
      createdAt: Date.now(),
      status: "applied",
    };

    this.mutations.push(promotionRecord);
    await this.saveMutations();

    return { sharedPaths };
  }

  // ─── Rollback ───────────────────────────────────────

  /** Roll back a mutation */
  async rollback(mutationId: string): Promise<boolean> {
    const mutation = this.mutations.find((m) => m.id === mutationId);
    if (!mutation || mutation.status !== "applied") return false;

    const releaseFns: (() => void)[] = [];
    try {
      for (const file of mutation.files) {
        const release = await acquireLock(join(this.appRoot, file.path));
        releaseFns.push(release);
      }

      for (const file of [...mutation.files].reverse()) {
        await this.rollbackFile(file);
      }

      mutation.status = "rolled_back";
      await this.saveMutations();
      return true;
    } finally {
      for (const release of releaseFns) {
        release();
      }
    }
  }

  // ─── Queries ────────────────────────────────────────

  /** Get all mutations for a user */
  getUserMutations(userId: string): ServerMutation[] {
    return this.mutations.filter((m) => m.userId === userId);
  }

  /** Get all active mutations */
  getActiveMutations(): ServerMutation[] {
    return this.mutations.filter((m) => m.status === "applied");
  }

  /** Get shared (promoted) mutations */
  getSharedMutations(): ServerMutation[] {
    return this.mutations.filter(
      (m) => m.status === "applied" && m.prompt.startsWith("Promoted mutation")
    );
  }

  /**
   * List all generated files for a user.
   * Returns paths relative to appRoot.
   */
  async listUserFiles(userId: string): Promise<string[]> {
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const userDir = join(this.appRoot, this.generatedDir, safeUserId);
    if (!existsSync(userDir)) return [];

    const files: string[] = [];
    const walk = async (dir: string) => {
      const { readdir, stat } = await import("fs/promises");
      const entries = await readdir(dir);
      for (const entry of entries) {
        const full = join(dir, entry);
        const s = await stat(full);
        if (s.isDirectory()) {
          await walk(full);
        } else {
          files.push(relative(this.appRoot, full));
        }
      }
    };
    await walk(userDir);
    return files;
  }

  /**
   * List shared generated files.
   */
  async listSharedFiles(): Promise<string[]> {
    const sharedDir = join(this.appRoot, this.generatedDir, "shared");
    if (!existsSync(sharedDir)) return [];

    const files: string[] = [];
    const walk = async (dir: string) => {
      const { readdir, stat } = await import("fs/promises");
      const entries = await readdir(dir);
      for (const entry of entries) {
        const full = join(dir, entry);
        const s = await stat(full);
        if (s.isDirectory()) {
          await walk(full);
        } else {
          files.push(relative(this.appRoot, full));
        }
      }
    };
    await walk(sharedDir);
    return files;
  }

  // ─── Internals ──────────────────────────────────────

  private async rollbackFile(file: FileChange) {
    const fullPath = join(this.appRoot, file.path);
    if (file.action === "delete" && file.original) {
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, file.original, "utf-8");
    } else if (file.original) {
      await writeFile(fullPath, file.original, "utf-8");
    } else if (file.action === "create") {
      if (existsSync(fullPath)) await unlink(fullPath);
    }
  }

  private async saveMutations() {
    const mutFile = join(this.appRoot, MUTATIONS_FILE);
    const release = await acquireLock(mutFile);
    try {
      await mkdir(dirname(mutFile), { recursive: true });
      await writeFile(mutFile, JSON.stringify(this.mutations, null, 2), "utf-8");
    } finally {
      release();
    }
  }
}
