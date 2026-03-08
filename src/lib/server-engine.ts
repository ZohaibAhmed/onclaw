/**
 * Server-side mutation engine.
 * This runs on your backend — generates real files, API routes, server components.
 * NOT bundled into the client; import from "onclaw/server".
 */

import type { SlotConfig } from "../types";

export interface ServerMutation {
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

export interface FileChange {
  path: string;
  content: string;
  action: "create" | "modify" | "delete";
  /** Original content for rollback */
  original?: string;
}

export interface ServerEngineConfig {
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

const SERVER_SYSTEM_PROMPT = `You are a Next.js code generator for OnClaw server-side mutations.
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

export async function generateServerMutation(
  prompt: string,
  config: ServerEngineConfig,
  context?: {
    slotId?: string;
    slotConfig?: SlotConfig;
    existingFiles?: { path: string; content: string }[];
  }
): Promise<ServerMutation> {
  const userPrompt = buildServerPrompt(prompt, context);

  const res = await fetch(config.llmEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.llmApiKey
        ? { Authorization: `Bearer ${config.llmApiKey}` }
        : {}),
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SERVER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status}`);
  }

  const data = await res.json();
  const raw =
    data.choices?.[0]?.message?.content || data.content?.[0]?.text || "";

  const { files, clientCode } = parseServerResponse(raw);

  return {
    id: `sm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId: "pending", // Set by caller
    prompt,
    files,
    clientCode,
    needsRebuild: files.some(
      (f) =>
        f.path.includes("route.ts") ||
        f.path.includes("layout.") ||
        f.path.includes("page.")
    ),
    createdAt: Date.now(),
    status: "pending",
  };
}

function buildServerPrompt(
  prompt: string,
  context?: {
    slotId?: string;
    slotConfig?: SlotConfig;
    existingFiles?: { path: string; content: string }[];
  }
): string {
  let full = prompt;
  if (context?.slotConfig) {
    full += `\n\nTarget area: "${context.slotConfig.name}"`;
    if (context.slotConfig.description)
      full += ` — ${context.slotConfig.description}`;
  }
  if (context?.existingFiles?.length) {
    full += `\n\nExisting files for context:\n`;
    for (const f of context.existingFiles) {
      full += `\n--- ${f.path} ---\n${f.content}\n`;
    }
  }
  return full;
}

function parseServerResponse(raw: string): {
  files: FileChange[];
  clientCode?: string;
} {
  // Strip markdown fences
  let cleaned = raw
    .replace(/```(?:json)?\n?/g, "")
    .replace(/```$/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    // New format: { files: [...], clientCode: "..." }
    if (parsed.files && Array.isArray(parsed.files)) {
      return {
        files: parsed.files.map((f: Record<string, string>) => ({
          path: f.path,
          content: f.content,
          action: (f.action as FileChange["action"]) || "create",
        })),
        clientCode: parsed.clientCode,
      };
    }

    // Legacy format: plain array
    if (Array.isArray(parsed)) {
      return {
        files: parsed.map((f: Record<string, string>) => ({
          path: f.path,
          content: f.content,
          action: (f.action as FileChange["action"]) || "create",
        })),
      };
    }

    throw new Error("Unexpected response format");
  } catch (e) {
    // Try to extract JSON object or array from the response
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

export { SERVER_SYSTEM_PROMPT };
