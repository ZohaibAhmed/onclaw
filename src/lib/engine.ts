import type { GenerateRequest, GenerateResponse, ConversationMessage } from "../types";
import { transformJSX } from "./jsx-transform";

const SYSTEM_PROMPT = `You are a React component modifier for OnClaw. You make MINIMAL, SURGICAL changes to existing components based on user requests.

## Core Principle: MODIFY, DON'T REBUILD
You will receive the ORIGINAL component code. Your job is to ADD the requested feature while keeping EVERYTHING else exactly the same — same structure, same styles, same colors, same layout. If the user asks to "add a pinned messages sidebar", you add ONLY the pinned messages sidebar to the existing component. Do NOT rewrite the whole thing.

## Rules
- Output ONLY the component code — no markdown, no \`\`\`, no explanations
- React is available as a global — use React.useState, React.useEffect, etc.
- Assign the component to \`const Component\`
- JSX syntax is supported — it will be automatically transpiled
- The component receives a \`props\` object
- No external dependencies — vanilla React only
- \`ctx\` object is available as a global with \`ctx.queries\` and \`ctx.actions\` for real data access
- Use ctx.queries for real data when available; fall back to mock data only if no relevant query exists

## Style Rules (CRITICAL)
- MATCH the existing component's visual style EXACTLY — same colors, same spacing, same fonts
- If the original uses hardcoded colors (e.g. #121212, bg-[#19171D]), use those SAME colors in new elements
- If the original uses Tailwind classes, use Tailwind classes
- If the original uses inline styles, use inline styles
- Do NOT introduce CSS variables (var(--ck-*)) unless the original already uses them
- New elements should look like they were ALWAYS part of the original design
- When in doubt, copy the exact styling patterns from the surrounding code

## Modification Rules
- PRESERVE all existing functionality — don't remove or break anything
- ADD only what the user asked for
- Keep the same component structure — don't reorganize or refactor
- If adding a new section (e.g. sidebar), slot it into the existing layout naturally
- Match the existing naming conventions and code patterns`;

function buildMessages(request: GenerateRequest): { role: string; content: string }[] {
  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Add conversation history for iterative refinement
  if (request.conversationHistory?.length) {
    for (const msg of request.conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: buildPrompt(request) });
  return messages;
}

/** Standard (non-streaming) generation */
export async function generateComponent(
  request: GenerateRequest,
  endpoint: string
): Promise<GenerateResponse> {
  const messages = buildMessages(request);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: 4096 }),
  });

  if (!res.ok) {
    throw new Error(`Generation failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || data.content?.[0]?.text || "";
  const code = extractCode(raw);

  return { code, explanation: "Component generated successfully" };
}

/** Streaming generation — yields partial tokens via callback */
export async function generateComponentStream(
  request: GenerateRequest,
  endpoint: string,
  onToken: (token: string, accumulated: string) => void
): Promise<GenerateResponse> {
  const messages = buildMessages(request);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: 4096, stream: true }),
  });

  if (!res.ok) {
    throw new Error(`Generation failed: ${res.status} ${await res.text()}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body for streaming");

  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload);
        // Support both OpenAI-style and our custom format
        const token =
          parsed.token ??
          parsed.choices?.[0]?.delta?.content ??
          "";
        if (token) {
          accumulated += token;
          onToken(token, accumulated);
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  const code = extractCode(accumulated);
  return { code, explanation: "Component generated successfully" };
}

function buildPrompt(req: GenerateRequest): string {
  let prompt = req.prompt;
  if (req.slotContext) {
    prompt += `\n\nThis component goes in the "${req.slotContext.name}" area.`;
    if (req.slotContext.description) prompt += ` ${req.slotContext.description}`;
    if (req.slotContext.availableProps) {
      prompt += `\nAvailable props: ${JSON.stringify(req.slotContext.availableProps)}`;
    }
  }
  if (req.appContext) {
    prompt += `\n\nApp styling: ${req.appContext}`;
  }
  // Existing generated code takes priority (iterative refinement)
  if (req.existingCode) {
    prompt += `\n\nHere is the CURRENT component code. Make ONLY the changes I asked for — keep everything else identical:\n\`\`\`\n${req.existingCode}\n\`\`\``;
  }
  // Original slot code — the default content being replaced (first generation)
  else if (req.slotContext?.originalCode) {
    prompt += `\n\nHere is the ORIGINAL component code for this slot. Use it as the BASE — preserve its structure, styles, and colors. Add ONLY what I asked for:\n\`\`\`\n${req.slotContext.originalCode}\n\`\`\``;
  }
  return prompt;
}

function extractCode(raw: string): string {
  let code = raw.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "").replace(/```\s*$/gm, "").trim();

  // Remove any import/export statements the LLM might add
  code = code.replace(/^import\s+.*?[;\n]/gm, "");
  code = code.replace(/^export\s+(default\s+)?/gm, "");

  if (!code.includes("Component")) {
    code = `const Component = (props) => {\n  return ${code}\n};`;
  }

  // Transform JSX to React.createElement if JSX is detected
  if (/<[A-Za-z][^>]*>/.test(code)) {
    code = transformJSX(code);
  }

  return code;
}

/** Compile a code string into a render function */
export function compileComponent(
  code: string,
  React: typeof import("react"),
  ctx?: any
): ((props: Record<string, unknown>) => React.ReactNode) | null {
  const args = ctx ? ["React", "ctx"] : ["React"];
  const vals = ctx ? [React, ctx] : [React];

  // First attempt: compile as-is
  try {
    const factory = new Function(...args, `${code}\nreturn Component;`);
    return factory(...vals);
  } catch (firstErr) {
    // Second attempt: transform JSX and retry
    try {
      const transformed = transformJSX(code);
      if (transformed !== code) {
        const factory = new Function(...args, `${transformed}\nreturn Component;`);
        return factory(...vals);
      }
    } catch {
      // Fall through
    }

    // Third attempt: wrap in Component if missing
    try {
      const wrapped = code.includes("Component")
        ? code
        : `const Component = (props) => {\n  return ${code}\n};`;
      const transformed = transformJSX(wrapped);
      const factory = new Function(...args, `${transformed}\nreturn Component;`);
      return factory(...vals);
    } catch {
      // Fall through
    }

    console.error("[OnClaw] Failed to compile component:", firstErr);
    return null;
  }
}
