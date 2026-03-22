import type { GenerateRequest, GenerateResponse, ConversationMessage } from "../types";
import { transformJSX } from "./jsx-transform";

const BASE_RULES = `## Output Rules
- Output ONLY the component code — no markdown, no \`\`\`, no explanations
- React is available as a global — use React.useState, React.useEffect, etc.
- Assign the component to \`const Component\`
- JSX syntax is supported — it will be automatically transpiled
- The component receives a \`props\` object
- No external dependencies — vanilla React only
- \`ctx\` object is available as a global with \`ctx.queries\` and \`ctx.actions\` for real data access
- Use ctx.queries for real data when available; fall back to mock data only if no relevant query exists`;

const GENERATOR_PROMPT = `You are a React component generator for OnClaw. You create NEW components that match the app's existing visual style.

${BASE_RULES}

## Style Rules
- If app styling context is provided, match it EXACTLY — use the same colors, fonts, spacing, and patterns
- Use inline styles with the app's actual color values (e.g. background: "#1A1D21") — NOT generic CSS variables
- If the app uses Tailwind-style classes, describe the equivalent in inline styles since you're generating runtime code
- Make it responsive and polished — use good typography, whitespace, and visual hierarchy
- The component should look like it BELONGS in the existing app — not like a widget dropped in from somewhere else`;

const MODIFIER_PROMPT = `You are a React component modifier for OnClaw. You make MINIMAL, SURGICAL changes to existing components based on user requests.

## Core Principle: MODIFY, DON'T REBUILD
You will receive the EXISTING component code. Your job is to ADD the requested feature while keeping EVERYTHING else exactly the same — same structure, same styles, same colors, same layout. Do NOT rewrite the whole thing.

${BASE_RULES}

## Style Rules (CRITICAL)
- MATCH the existing component's visual style EXACTLY — same colors, same spacing, same fonts
- If the original uses hardcoded colors (e.g. #121212, bg-[#19171D]), use those SAME colors in new elements
- If the original uses inline styles, use inline styles
- Do NOT introduce CSS variables (var(--ck-*)) unless the original already uses them
- New elements should look like they were ALWAYS part of the original design

## Modification Rules
- PRESERVE all existing functionality — don't remove or break anything
- ADD only what the user asked for
- Keep the same component structure — don't reorganize or refactor
- If adding a new section (e.g. sidebar), slot it into the existing layout naturally
- Match the existing naming conventions and code patterns`;

function buildMessages(request: GenerateRequest): { role: string; content: string }[] {
  const hasExisting = !!(request.existingCode || request.slotContext?.originalCode);
  const systemPrompt = hasExisting ? MODIFIER_PROMPT : GENERATOR_PROMPT;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
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

  // Strip TypeScript syntax that breaks runtime compilation
  code = stripTypeScript(code);

  if (!code.includes("Component")) {
    code = `const Component = (props) => {\n  return ${code}\n};`;
  }

  // Transform JSX to React.createElement if JSX is detected
  if (/<[A-Za-z][^>]*>/.test(code)) {
    code = transformJSX(code);
  }

  return code;
}

/**
 * Strip TypeScript-specific syntax to produce valid JavaScript.
 * Handles the common TS patterns LLMs add to generated components.
 */
function stripTypeScript(code: string): string {
  // Remove interface/type declarations (full blocks)
  code = code.replace(/^(?:export\s+)?interface\s+\w+\s*(?:<[^>]*>)?\s*\{[^}]*\}\s*;?\s*\n?/gm, "");
  code = code.replace(/^(?:export\s+)?type\s+\w+\s*(?:<[^>]*>)?\s*=\s*[^;]+;\s*\n?/gm, "");

  // Remove 'as Type' assertions (but not 'as' in other contexts like destructuring aliases)
  // Match: expression as TypeName — uppercase types AND lowercase primitives (string, number, boolean, etc.)
  // Also handles: as string[], as Record<string, any>, as const
  code = code.replace(/\s+as\s+(?:[A-Z]\w*(?:<[^>]*>)?(?:\[\])*|(?:string|number|boolean|any|unknown|never|void|null|undefined|object|bigint|symbol|const)(?:\[\])*)/g, "");

  // Remove type annotations on const/let/var declarations: const x: Type = ...
  // Handles: const Component: React.FC<Props> = ..., const x: string[] = ...
  code = code.replace(/((?:const|let|var)\s+\w+)\s*:\s*(?:[A-Za-z_][\w.]*(?:<(?:[^<>]|<[^>]*>)*>)?(?:\[\])*)\s*=/g, "$1 =");

  // Remove type annotations on function parameters: (x: Type) => ... or function(x: Type)
  // Only target arrow function and function definition parameter lists — NOT all parentheses.
  // Pattern: match params followed by => or { (function body)
  // Handles: (props: Props) => ..., (x: string, y: number) => ..., function(x: Type) { ... }
  code = code.replace(/(\([^)]*\))\s*(?==>|{)/g, (match) => {
    // Only strip param annotations, not object properties
    // Match: identifier: TypeName (but not inside object literals like { key: value })
    return match.replace(/(\b\w+)\s*:\s*(?:[A-Z]\w*(?:<(?:[^<>]|<[^>]*>)*>)?(?:\[\])*|(?:string|number|boolean|any|unknown|never|void|null|undefined|object)(?:\[\])*)/g, "$1");
  });

  // Remove generic type parameters from function calls: useState<string[]>(...) → useState(...)
  // Match: identifier<Type>( — handles identifiers, string/number literals, unions, objects
  // Examples: useState<string>(""), useState<"a" | "b">("a"), useRef<HTMLDivElement>(null)
  code = code.replace(/(\w+)\s*<((?:[A-Za-z_][\w.]*(?:\[\])?(?:\s*\|\s*(?:[A-Za-z_][\w.]*(?:\[\])?|"[^"]*"|'[^']*'|\d+|null|undefined))*)|(?:"[^"]*"(?:\s*\|\s*(?:"[^"]*"|'[^']*'|[A-Za-z_]\w*|null|undefined))*)|(?:\{[^}]*\}))>\s*\(/g, "$1(");

  // Remove destructured parameter type annotations: ({ name }: { name: string }) → ({ name })
  code = code.replace(/(\}\s*):\s*\{[^}]*\}/g, "$1");

  // Remove generic type parameter declarations on arrow functions: <T extends ...>(props) =>
  code = code.replace(/<\s*\w+\s+extends\s+\w+[^>]*>\s*(?=\()/g, "");

  // Remove non-null assertions: ref.current!.focus() → ref.current.focus()
  code = code.replace(/(\w+)!/g, "$1");

  // Remove 'satisfies' keyword: {} satisfies Type → {}
  code = code.replace(/\s+satisfies\s+[A-Za-z_][\w.<>,\s|&]*(?=[;\s)\],}])/g, "");

  // Remove const enum declarations: const enum Status { ... }
  code = code.replace(/^(?:export\s+)?const\s+enum\s+\w+\s*\{[^}]*\}\s*;?\s*\n?/gm, "");

  // Remove intersection/union type annotations on variables: const x: A & B = ... or const x: A | B = ...
  code = code.replace(/((?:const|let|var)\s+\w+)\s*:\s*(?:[A-Za-z_][\w.]*(?:<[^>]*>)?(?:\[\])?(?:\s*[&|]\s*[A-Za-z_][\w.]*(?:<[^>]*>)?(?:\[\])?)*)\s*=/g, "$1 =");

  // Remove tuple type annotations: const [a, b]: [string, number] = ...
  code = code.replace(/(const\s+\[[^\]]*\])\s*:\s*\[[^\]]*\]\s*=/g, "$1 =");

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

  // Pre-process: strip imports/exports, transform JSX, then strip TS from safe output.
  // Order matters: JSX transform first (produces React.createElement), then only safe TS
  // stripping (interfaces, type declarations, as assertions, const annotations, generics).
  // We skip the aggressive param annotation regex after JSX transform to avoid corrupting
  // createElement argument patterns.
  function prepare(src: string): string {
    let c = src;
    // Strip import/export statements (LLMs sometimes include these)
    c = c.replace(/^import\s+.*?[;\n]/gm, "");
    c = c.replace(/^export\s+(default\s+)?/gm, "");

    // Safe TS stripping that won't corrupt JSX or JS expressions:
    // 1. Interface/type declarations (full blocks at line start)
    c = c.replace(/^(?:export\s+)?interface\s+\w+\s*(?:<[^>]*>)?\s*\{[^}]*\}\s*;?\s*\n?/gm, "");
    c = c.replace(/^(?:export\s+)?type\s+\w+\s*(?:<[^>]*>)?\s*=\s*[^;]+;\s*\n?/gm, "");
    // 2. 'as Type' assertions
    c = c.replace(/\s+as\s+(?:[A-Z]\w*(?:<[^>]*>)?(?:\[\])*|(?:string|number|boolean|any|unknown|never|void|null|undefined|object|bigint|symbol|const)(?:\[\])*)/g, "");
    // 3. const/let/var type annotations: const x: Type = ...
    c = c.replace(/((?:const|let|var)\s+\w+)\s*:\s*(?:[A-Za-z_][\w.]*(?:<(?:[^<>]|<[^>]*>)*>)?(?:\[\])*)\s*=/g, "$1 =");
    // 4. Generic type params on function calls: useState<string>(...) → useState(...)
    c = c.replace(/(\w+)\s*<((?:[A-Za-z_][\w.]*(?:\[\])?(?:\s*\|\s*(?:[A-Za-z_][\w.]*(?:\[\])?|"[^"]*"|'[^']*'|\d+|null|undefined))*)|(?:"[^"]*"(?:\s*\|\s*(?:"[^"]*"|'[^']*'|[A-Za-z_]\w*|null|undefined))*)|(?:\{[^}]*\}))>\s*\(/g, "$1(");

    // Transform JSX (now safe — only non-destructive TS stripping was applied)
    if (/<[A-Za-z][^>]*>/.test(c)) c = transformJSX(c);
    return c;
  }

  // Helper: compile code string → Component function (throws on syntax error)
  function tryCompile(src: string): ((props: Record<string, unknown>) => any) | null {
    const factory = new Function(...args, `${src}\nreturn Component;`);
    const result = factory(...vals);
    return typeof result === "function" ? result : null;
  }

  // First attempt: compile as-is
  try {
    return tryCompile(code);
  } catch (firstErr) {
    // Second attempt: transform JSX + strip TS
    try {
      const prepared = prepare(code);
      if (prepared !== code) {
        const result = tryCompile(prepared);
        if (result) return result;
      }
    } catch (secondErr) {
      // Log for debugging — this catch should rarely fire
      if (process.env.ONCLAW_DEBUG) {
        console.error("[OnClaw] Second attempt failed:", secondErr);
      }
    }

    // Third attempt: wrap in Component if missing
    try {
      const wrapped = code.includes("Component")
        ? code
        : `const Component = (props) => {\n  return ${code}\n};`;
      const prepared = prepare(wrapped);
      const result = tryCompile(prepared);
      if (result) return result;
    } catch (thirdErr) {
      if (process.env.ONCLAW_DEBUG) {
        console.error("[OnClaw] Third attempt failed:", thirdErr);
      }
    }

    console.error("[OnClaw] Failed to compile component:", firstErr);
    return null;
  }
}
