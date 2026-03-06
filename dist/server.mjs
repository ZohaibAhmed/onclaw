// src/lib/server-engine.ts
var SERVER_SYSTEM_PROMPT = `You are a Next.js code generator for ClawKit server-side mutations.
You generate real, production-quality Next.js code that will be written to the filesystem.
You ALSO generate a client-renderable preview version for instant display.

Rules:
- Output a JSON object with two fields:
  "files": array of file changes [{"path": "relative/path.tsx", "content": "...", "action": "create|modify"}]
  "clientCode": a self-contained component using ONLY React.createElement (NO JSX, NO imports, NO exports). This version renders immediately in the browser. Use inline styles, not className/Tailwind. Use CSS variables: var(--ck-bg), var(--ck-text), var(--ck-accent), var(--ck-border), var(--ck-radius). Assign the component to \`const Component = ...\`.
- The files array contains the real Next.js code (with imports, JSX, Tailwind, etc.)
- The clientCode is a simplified preview of the same component for instant rendering
- Paths are relative to the app root
- For new API routes, use app/api/[name]/route.ts pattern
- For new server components, use app/components/[user-namespace]/[name].tsx
- NEVER modify existing files like page.tsx, layout.tsx, or any file that already exists
- ONLY create NEW files in app/components/ or app/api/ directories
- If asked to modify something on the page, create a NEW component that replaces the slot content
- Use TypeScript, modern Next.js patterns (App Router, Server Components, Server Actions)
- Do NOT use external packages unless they're standard Next.js deps (next, react)
- Keep components self-contained
- Output ONLY the JSON object, no markdown, no explanation

Example output:
{"files":[{"path":"app/components/sidebar/Stats.tsx","content":"'use client';\\nimport { useState } from 'react';\\nexport default function Stats() { ... }","action":"create"}],"clientCode":"const Component = (props) => { const [count, setCount] = React.useState(0); return React.createElement(\\"div\\", { style: { padding: \\"1rem\\", background: \\"var(--ck-bg)\\", borderRadius: \\"var(--ck-radius)\\", color: \\"var(--ck-text)\\" } }, \\"Hello\\"); };"}`;
async function generateServerMutation(prompt, config, context) {
  const userPrompt = buildServerPrompt(prompt, context);
  const res = await fetch(config.llmEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...config.llmApiKey ? { Authorization: `Bearer ${config.llmApiKey}` } : {}
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SERVER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 8192
    })
  });
  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || data.content?.[0]?.text || "";
  const { files, clientCode } = parseServerResponse(raw);
  return {
    id: `sm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId: "pending",
    // Set by caller
    prompt,
    files,
    clientCode,
    needsRebuild: files.some(
      (f) => f.path.includes("route.ts") || f.path.includes("layout.") || f.path.includes("page.")
    ),
    createdAt: Date.now(),
    status: "pending"
  };
}
function buildServerPrompt(prompt, context) {
  let full = prompt;
  if (context?.slotConfig) {
    full += `

Target area: "${context.slotConfig.name}"`;
    if (context.slotConfig.description)
      full += ` \u2014 ${context.slotConfig.description}`;
  }
  if (context?.existingFiles?.length) {
    full += `

Existing files for context:
`;
    for (const f of context.existingFiles) {
      full += `
--- ${f.path} ---
${f.content}
`;
    }
  }
  return full;
}
function parseServerResponse(raw) {
  let cleaned = raw.replace(/```(?:json)?\n?/g, "").replace(/```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.files && Array.isArray(parsed.files)) {
      return {
        files: parsed.files.map((f) => ({
          path: f.path,
          content: f.content,
          action: f.action || "create"
        })),
        clientCode: parsed.clientCode
      };
    }
    if (Array.isArray(parsed)) {
      return {
        files: parsed.map((f) => ({
          path: f.path,
          content: f.content,
          action: f.action || "create"
        }))
      };
    }
    throw new Error("Unexpected response format");
  } catch (e) {
    const objMatch = cleaned.match(/\{[\s\S]*"files"[\s\S]*\}/);
    if (objMatch) {
      return parseServerResponse(objMatch[0]);
    }
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      const files = JSON.parse(arrMatch[0]);
      return { files };
    }
    throw new Error("Failed to parse server response from LLM");
  }
}

// src/lib/mutation-manager.ts
import { readFile, writeFile, mkdir, unlink, rename } from "fs/promises";
import { dirname, join, normalize, relative } from "path";
import { existsSync } from "fs";
var MUTATIONS_FILE = ".clawkit/mutations.json";
var GENERATED_DIR = "src/clawkit/generated";
var LOCK_TIMEOUT_MS = 1e4;
var locks = /* @__PURE__ */ new Map();
async function acquireLock(path) {
  const key = normalize(path);
  while (locks.has(key)) {
    const existing = locks.get(key);
    if (Date.now() - existing.timestamp > LOCK_TIMEOUT_MS) {
      existing.resolve();
      locks.delete(key);
      break;
    }
    await existing.promise;
  }
  let releaseFn;
  const promise = new Promise((resolve) => {
    releaseFn = resolve;
  });
  locks.set(key, { resolve: releaseFn, promise, timestamp: Date.now() });
  return () => {
    locks.delete(key);
    releaseFn();
  };
}
var _MutationManager = class _MutationManager {
  constructor(config) {
    this.config = config;
    this.mutations = [];
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
    await mkdir(join(this.appRoot, this.generatedDir, "shared"), { recursive: true });
  }
  isProtected(path) {
    const allPatterns = [..._MutationManager.PROTECTED_PATTERNS, ...this.extraProtected];
    return allPatterns.some((p) => p.test(path));
  }
  /**
   * Resolve a file path for a specific user.
   * All paths are forced into the user's namespace under the generated directory.
   * e.g., "components/DealChart.tsx" → "src/clawkit/generated/user-123/components/DealChart.tsx"
   */
  resolveUserPath(filePath, userId) {
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const userDir = join(this.generatedDir, safeUserId);
    const normalizedPath = normalize(filePath);
    if (normalizedPath.startsWith(this.generatedDir)) {
      const relativePart = relative(this.generatedDir, normalizedPath);
      const parts = relativePart.split("/");
      if (parts[0] === safeUserId || parts[0] === "shared") {
        return normalizedPath;
      }
      return join(userDir, relativePart);
    }
    return join(userDir, filePath);
  }
  /**
   * Resolve a file path for shared/promoted components.
   */
  resolveSharedPath(filePath) {
    const sharedDir = join(this.generatedDir, "shared");
    const normalizedPath = normalize(filePath);
    if (normalizedPath.startsWith(sharedDir)) return normalizedPath;
    if (normalizedPath.startsWith(this.generatedDir)) {
      const relativePart = relative(this.generatedDir, normalizedPath);
      const parts = relativePart.split("/");
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
  isPathSafe(resolvedPath) {
    const fullResolved = join(this.appRoot, resolvedPath);
    const fullGenDir = join(this.appRoot, this.generatedDir);
    return normalize(fullResolved).startsWith(normalize(fullGenDir));
  }
  // ─── Apply Mutation ─────────────────────────────────
  /** Apply a mutation — write files to disk, namespaced to the user */
  async apply(mutation) {
    const userId = mutation.userId;
    mutation.files = mutation.files.map((f) => ({
      ...f,
      path: this.resolveUserPath(f.path, userId)
    }));
    mutation.files = mutation.files.filter((f) => {
      if (this.isProtected(f.path)) {
        console.warn(`[ClawKit] Blocked modification of protected file: ${f.path}`);
        return false;
      }
      if (!this.isPathSafe(f.path)) {
        console.warn(`[ClawKit] Blocked path traversal attempt: ${f.path}`);
        return false;
      }
      if (f.content && f.content.length > this.maxFileSize) {
        console.warn(`[ClawKit] File too large (${f.content.length} bytes): ${f.path}`);
        return false;
      }
      return true;
    });
    if (mutation.files.length === 0) {
      mutation.status = "failed";
      mutation.error = "No valid files to write";
      return mutation;
    }
    const releaseFns = [];
    try {
      for (const file of mutation.files) {
        const release = await acquireLock(join(this.appRoot, file.path));
        releaseFns.push(release);
      }
      const applied = [];
      try {
        for (const file of mutation.files) {
          const fullPath = join(this.appRoot, file.path);
          if (existsSync(fullPath)) {
            file.original = await readFile(fullPath, "utf-8");
          }
          if (file.action === "delete") {
            if (existsSync(fullPath)) {
              const trashPath = join(this.appRoot, ".clawkit", "trash", file.path);
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
        for (const file of applied) {
          try {
            await this.rollbackFile(file);
          } catch {
          }
        }
        mutation.status = "failed";
        mutation.error = err instanceof Error ? err.message : String(err);
      }
    } finally {
      for (const release of releaseFns) {
        release();
      }
    }
    this.mutations.push(mutation);
    await this.saveMutations();
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
  async promote(mutationId, approvedBy) {
    const mutation = this.mutations.find((m) => m.id === mutationId);
    if (!mutation || mutation.status !== "applied") return null;
    const sharedPaths = [];
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
    const promotionRecord = {
      id: `promo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      userId: approvedBy,
      prompt: `Promoted mutation ${mutationId} to shared`,
      files: sharedPaths.map((p) => ({
        path: p,
        content: "",
        // Content already written
        action: "create"
      })),
      clientCode: mutation.clientCode,
      needsRebuild: true,
      createdAt: Date.now(),
      status: "applied"
    };
    this.mutations.push(promotionRecord);
    await this.saveMutations();
    return { sharedPaths };
  }
  // ─── Rollback ───────────────────────────────────────
  /** Roll back a mutation */
  async rollback(mutationId) {
    const mutation = this.mutations.find((m) => m.id === mutationId);
    if (!mutation || mutation.status !== "applied") return false;
    const releaseFns = [];
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
  getUserMutations(userId) {
    return this.mutations.filter((m) => m.userId === userId);
  }
  /** Get all active mutations */
  getActiveMutations() {
    return this.mutations.filter((m) => m.status === "applied");
  }
  /** Get shared (promoted) mutations */
  getSharedMutations() {
    return this.mutations.filter(
      (m) => m.status === "applied" && m.prompt.startsWith("Promoted mutation")
    );
  }
  /**
   * List all generated files for a user.
   * Returns paths relative to appRoot.
   */
  async listUserFiles(userId) {
    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const userDir = join(this.appRoot, this.generatedDir, safeUserId);
    if (!existsSync(userDir)) return [];
    const files = [];
    const walk = async (dir) => {
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
  async listSharedFiles() {
    const sharedDir = join(this.appRoot, this.generatedDir, "shared");
    if (!existsSync(sharedDir)) return [];
    const files = [];
    const walk = async (dir) => {
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
  async rollbackFile(file) {
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
  async saveMutations() {
    const mutFile = join(this.appRoot, MUTATIONS_FILE);
    const release = await acquireLock(mutFile);
    try {
      await mkdir(dirname(mutFile), { recursive: true });
      await writeFile(mutFile, JSON.stringify(this.mutations, null, 2), "utf-8");
    } finally {
      release();
    }
  }
};
// ─── Path Safety ────────────────────────────────────
/** Files that should never be modified by mutations */
_MutationManager.PROTECTED_PATTERNS = [
  /^app\/page\./,
  /^app\/layout\./,
  /^app\/globals\./,
  /^src\/app\/page\./,
  /^src\/app\/layout\./,
  /^package\.json$/,
  /^tsconfig/,
  /^next\.config/,
  /^\.env/,
  /^\.clawkit\/project\.json$/
];
var MutationManager = _MutationManager;
export {
  MutationManager,
  SERVER_SYSTEM_PROMPT,
  generateServerMutation
};
//# sourceMappingURL=server.mjs.map