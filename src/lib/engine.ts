import type { GenerateRequest, GenerateResponse, ConversationMessage } from "../types";
import { transformJSX } from "./jsx-transform";

const SYSTEM_PROMPT = `You are a React component generator for ClawKit. You generate self-contained React functional components.

CRITICAL RULES:
- Output ONLY the component code — no markdown, no \`\`\`, no imports, no exports
- React is available as a global — use React.useState, React.useEffect, React.createElement, etc.
- Assign the component to \`const Component\`
- You may use JSX syntax — it will be automatically transpiled
- Use inline styles with clean, modern aesthetics and good spacing
- Use these CSS variables for theming: var(--ck-bg), var(--ck-text), var(--ck-text-muted), var(--ck-accent), var(--ck-border), var(--ck-radius), var(--ck-bg-secondary), var(--ck-bg-hover), var(--ck-font)
- The component receives a \`props\` object
- Make it responsive and polished — use good typography, whitespace, and visual hierarchy
- No external dependencies — vanilla React only
- A \`ctx\` object is available as a global with \`ctx.queries\` and \`ctx.actions\` for real data access
- Use ctx.queries to fetch real data: e.g., \`const [data, setData] = React.useState([]); React.useEffect(() => { ctx.queries.getDeals().then(setData); }, []);\`
- If ctx.queries has the data you need, USE IT instead of mock data — this gives real, live data
- Fall back to realistic mock/hardcoded data only if no relevant query exists
- Use React.createElement for all elements (no JSX transpiler is available at runtime)

Example:
const Component = (props) => {
  const [count, setCount] = React.useState(0);
  return React.createElement("div", { 
    style: { padding: "1.5rem", background: "var(--ck-bg-secondary)", borderRadius: "var(--ck-radius)", border: "1px solid var(--ck-border)", color: "var(--ck-text)", fontFamily: "var(--ck-font)" }
  }, 
    React.createElement("h2", { style: { margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 600 } }, "Hello"),
    React.createElement("p", { style: { margin: 0, color: "var(--ck-text-muted)", fontSize: "0.875rem" } }, "Count: " + count),
    React.createElement("button", { 
      onClick: () => setCount(c => c + 1),
      style: { marginTop: "1rem", padding: "0.5rem 1rem", background: "var(--ck-accent)", color: "#fff", border: "none", borderRadius: "var(--ck-radius)", cursor: "pointer", fontSize: "0.875rem" }
    }, "Increment")
  );
};`;

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
  if (req.existingCode) {
    prompt += `\n\nCurrent component code to modify:\n${req.existingCode}`;
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

    console.error("[ClawKit] Failed to compile component:", firstErr);
    return null;
  }
}
