"use client";

// src/components/provider.tsx
import React5, {
  createContext,
  useCallback as useCallback3,
  useContext,
  useEffect as useEffect2,
  useMemo as useMemo2,
  useRef as useRef2,
  useState as useState4
} from "react";

// src/store/local.ts
var STORAGE_KEY = "clawkit:components";
var LocalStoreAdapter = class {
  async load(userId) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  async save(component) {
    const all = await this.load(component.userId);
    const idx = all.findIndex((c) => c.id === component.id);
    if (idx >= 0) all[idx] = component;
    else all.push(component);
    localStorage.setItem(
      `${STORAGE_KEY}:${component.userId}`,
      JSON.stringify(all)
    );
  }
  async delete(userId, componentId) {
    const all = await this.load(userId);
    const filtered = all.filter((c) => c.id !== componentId);
    localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(filtered));
  }
};

// src/lib/jsx-transform.ts
function transformJSX(code) {
  if (!code.includes("<") || !/<[A-Za-z]/.test(code)) return code;
  let result = "";
  let i = 0;
  while (i < code.length) {
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const quote = code[i];
      result += quote;
      i++;
      if (quote === "`") {
        while (i < code.length) {
          if (code[i] === "\\" && i + 1 < code.length) {
            result += code[i] + code[i + 1];
            i += 2;
            continue;
          }
          if (code[i] === "$" && code[i + 1] === "{") {
            result += "${";
            i += 2;
            let depth = 1;
            while (i < code.length && depth > 0) {
              if (code[i] === "{") depth++;
              else if (code[i] === "}") depth--;
              if (depth > 0) result += code[i];
              else result += "}";
              i++;
            }
            continue;
          }
          if (code[i] === "`") {
            result += "`";
            i++;
            break;
          }
          result += code[i];
          i++;
        }
      } else {
        while (i < code.length) {
          if (code[i] === "\\" && i + 1 < code.length) {
            result += code[i] + code[i + 1];
            i += 2;
            continue;
          }
          if (code[i] === quote) {
            result += quote;
            i++;
            break;
          }
          result += code[i];
          i++;
        }
      }
      continue;
    }
    if (code[i] === "/" && code[i + 1] === "/") {
      while (i < code.length && code[i] !== "\n") {
        result += code[i];
        i++;
      }
      continue;
    }
    if (code[i] === "/" && code[i + 1] === "*") {
      result += "/*";
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
        result += code[i];
        i++;
      }
      if (i < code.length) {
        result += "*/";
        i += 2;
      }
      continue;
    }
    if (code[i] === "<" && i + 1 < code.length) {
      const next = code[i + 1];
      if (next === "/") {
        const closeEnd = code.indexOf(">", i);
        if (closeEnd !== -1) {
          i = closeEnd + 1;
          continue;
        }
      }
      if (/[A-Za-z]/.test(next)) {
        const lookback = result.slice(-20).trim();
        if (lookback.endsWith("return") || lookback.endsWith("(") || lookback.endsWith(",") || lookback.endsWith("?") || lookback.endsWith(":") || lookback.endsWith("&&") || lookback.endsWith("||") || lookback.endsWith("=>") || lookback.endsWith("{") || lookback.endsWith("[") || lookback.endsWith(";") || lookback.endsWith("\n") || lookback === "" || lookback.endsWith("React.createElement")) {
          const parsed = parseJSXElement(code, i);
          if (parsed) {
            result += parsed.output;
            i = parsed.end;
            continue;
          }
        }
      }
      if (next === ">") {
        const parsed = parseJSXFragment(code, i);
        if (parsed) {
          result += parsed.output;
          i = parsed.end;
          continue;
        }
      }
    }
    result += code[i];
    i++;
  }
  return result;
}
function parseJSXElement(code, start) {
  let i = start + 1;
  let tagName = "";
  while (i < code.length && /[A-Za-z0-9._]/.test(code[i])) {
    tagName += code[i];
    i++;
  }
  if (!tagName) return null;
  const isComponent = /^[A-Z]/.test(tagName);
  const tagRef = isComponent ? tagName : `"${tagName}"`;
  const attrs = [];
  let spreadAttrs = [];
  while (i < code.length) {
    while (i < code.length && /\s/.test(code[i])) i++;
    if (code[i] === "/" && code[i + 1] === ">") {
      i += 2;
      const propsStr2 = buildProps(attrs, spreadAttrs);
      return { output: `React.createElement(${tagRef}, ${propsStr2})`, end: i };
    }
    if (code[i] === ">") {
      i++;
      break;
    }
    if (code[i] === "{" && code[i + 1] === "." && code[i + 2] === "." && code[i + 3] === ".") {
      i += 4;
      let expr = "";
      let depth = 1;
      while (i < code.length && depth > 0) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        expr += code[i];
        i++;
      }
      spreadAttrs.push(expr.trim());
      continue;
    }
    let attrName = "";
    while (i < code.length && /[A-Za-z0-9_\-]/.test(code[i])) {
      attrName += code[i];
      i++;
    }
    if (!attrName) break;
    const reactAttr = htmlToReactAttr(attrName);
    if (code[i] === "=") {
      i++;
      if (code[i] === "{") {
        i++;
        let expr = "";
        let depth = 1;
        while (i < code.length && depth > 0) {
          if (code[i] === "{") depth++;
          else if (code[i] === "}") {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          expr += code[i];
          i++;
        }
        attrs.push(`${reactAttr}: ${transformJSX(expr.trim())}`);
      } else if (code[i] === '"' || code[i] === "'") {
        const quote = code[i];
        i++;
        let val = "";
        while (i < code.length && code[i] !== quote) {
          val += code[i];
          i++;
        }
        i++;
        attrs.push(`${reactAttr}: "${val}"`);
      }
    } else {
      attrs.push(`${reactAttr}: true`);
    }
  }
  const children = [];
  while (i < code.length) {
    if (code[i] === "<" && code[i + 1] === "/") {
      const closeEnd = code.indexOf(">", i);
      if (closeEnd !== -1) {
        i = closeEnd + 1;
        break;
      }
    }
    if (code[i] === "{") {
      i++;
      let expr = "";
      let depth = 1;
      while (i < code.length && depth > 0) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        expr += code[i];
        i++;
      }
      const trimmed = expr.trim();
      if (trimmed) children.push(transformJSX(trimmed));
      continue;
    }
    if (code[i] === "<") {
      if (code[i + 1] === ">" || code[i + 1] && /[A-Za-z]/.test(code[i + 1])) {
        const nested = code[i + 1] === ">" ? parseJSXFragment(code, i) : parseJSXElement(code, i);
        if (nested) {
          children.push(nested.output);
          i = nested.end;
          continue;
        }
      }
      break;
    }
    let text = "";
    while (i < code.length && code[i] !== "<" && code[i] !== "{") {
      text += code[i];
      i++;
    }
    const trimmedText = text.replace(/\s+/g, " ").trim();
    if (trimmedText) {
      children.push(`"${trimmedText.replace(/"/g, '\\"')}"`);
    }
  }
  const propsStr = buildProps(attrs, spreadAttrs);
  const args = [tagRef, propsStr, ...children].join(", ");
  return { output: `React.createElement(${args})`, end: i };
}
function parseJSXFragment(code, start) {
  let i = start + 2;
  const children = [];
  while (i < code.length) {
    if (code[i] === "<" && code[i + 1] === "/" && code[i + 2] === ">") {
      i += 3;
      break;
    }
    if (code[i] === "{") {
      i++;
      let expr = "";
      let depth = 1;
      while (i < code.length && depth > 0) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        expr += code[i];
        i++;
      }
      const trimmed2 = expr.trim();
      if (trimmed2) children.push(transformJSX(trimmed2));
      continue;
    }
    if (code[i] === "<" && code[i + 1] && /[A-Za-z]/.test(code[i + 1])) {
      const nested = parseJSXElement(code, i);
      if (nested) {
        children.push(nested.output);
        i = nested.end;
        continue;
      }
      break;
    }
    if (code[i] === "<" && code[i + 1] === ">") {
      const nested = parseJSXFragment(code, i);
      if (nested) {
        children.push(nested.output);
        i = nested.end;
        continue;
      }
      break;
    }
    let text = "";
    while (i < code.length && code[i] !== "<" && code[i] !== "{") {
      text += code[i];
      i++;
    }
    const trimmed = text.replace(/\s+/g, " ").trim();
    if (trimmed) children.push(`"${trimmed.replace(/"/g, '\\"')}"`);
  }
  const args = ["React.Fragment", "null", ...children].join(", ");
  return { output: `React.createElement(${args})`, end: i };
}
function buildProps(attrs, spreads) {
  if (attrs.length === 0 && spreads.length === 0) return "null";
  if (spreads.length > 0) {
    const base = attrs.length > 0 ? `{ ${attrs.join(", ")} }` : "{}";
    return `Object.assign(${base}, ${spreads.join(", ")})`;
  }
  return `{ ${attrs.join(", ")} }`;
}
function htmlToReactAttr(name) {
  const map = {
    class: "className",
    for: "htmlFor",
    "clip-path": "clipPath",
    "fill-rule": "fillRule",
    "font-size": "fontSize",
    "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    tabindex: "tabIndex",
    readonly: "readOnly",
    maxlength: "maxLength",
    colspan: "colSpan",
    rowspan: "rowSpan",
    enctype: "encType",
    contenteditable: "contentEditable",
    crossorigin: "crossOrigin",
    viewBox: "viewBox"
  };
  if (name.startsWith("on")) {
    return "on" + name.charAt(2).toUpperCase() + name.slice(3);
  }
  return map[name] ?? name;
}

// src/lib/engine.ts
var SYSTEM_PROMPT = `You are a React component generator for ClawKit. You generate self-contained React functional components.

CRITICAL RULES:
- Output ONLY the component code \u2014 no markdown, no \`\`\`, no imports, no exports
- React is available as a global \u2014 use React.useState, React.useEffect, React.createElement, etc.
- Assign the component to \`const Component\`
- You may use JSX syntax \u2014 it will be automatically transpiled
- Use inline styles with clean, modern aesthetics and good spacing
- Use these CSS variables for theming: var(--ck-bg), var(--ck-text), var(--ck-text-muted), var(--ck-accent), var(--ck-border), var(--ck-radius), var(--ck-bg-secondary), var(--ck-bg-hover), var(--ck-font)
- The component receives a \`props\` object
- Make it responsive and polished \u2014 use good typography, whitespace, and visual hierarchy
- No external dependencies \u2014 vanilla React only
- A \`ctx\` object is available as a global with \`ctx.queries\` and \`ctx.actions\` for real data access
- Use ctx.queries to fetch real data: e.g., \`const [data, setData] = React.useState([]); React.useEffect(() => { ctx.queries.getDeals().then(setData); }, []);\`
- If ctx.queries has the data you need, USE IT instead of mock data \u2014 this gives real, live data
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
function buildMessages(request) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT }
  ];
  if (request.conversationHistory?.length) {
    for (const msg of request.conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({ role: "user", content: buildPrompt(request) });
  return messages;
}
async function generateComponent(request, endpoint) {
  const messages = buildMessages(request);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: 4096 })
  });
  if (!res.ok) {
    throw new Error(`Generation failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || data.content?.[0]?.text || "";
  const code = extractCode(raw);
  return { code, explanation: "Component generated successfully" };
}
async function generateComponentStream(request, endpoint, onToken) {
  const messages = buildMessages(request);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: 4096, stream: true })
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
        const token = parsed.token ?? parsed.choices?.[0]?.delta?.content ?? "";
        if (token) {
          accumulated += token;
          onToken(token, accumulated);
        }
      } catch {
      }
    }
  }
  const code = extractCode(accumulated);
  return { code, explanation: "Component generated successfully" };
}
function buildPrompt(req) {
  let prompt = req.prompt;
  if (req.slotContext) {
    prompt += `

This component goes in the "${req.slotContext.name}" area.`;
    if (req.slotContext.description) prompt += ` ${req.slotContext.description}`;
    if (req.slotContext.availableProps) {
      prompt += `
Available props: ${JSON.stringify(req.slotContext.availableProps)}`;
    }
  }
  if (req.existingCode) {
    prompt += `

Current component code to modify:
${req.existingCode}`;
  }
  return prompt;
}
function extractCode(raw) {
  let code = raw.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "").replace(/```\s*$/gm, "").trim();
  code = code.replace(/^import\s+.*?[;\n]/gm, "");
  code = code.replace(/^export\s+(default\s+)?/gm, "");
  if (!code.includes("Component")) {
    code = `const Component = (props) => {
  return ${code}
};`;
  }
  if (/<[A-Za-z][^>]*>/.test(code)) {
    code = transformJSX(code);
  }
  return code;
}
function compileComponent(code, React9, ctx) {
  const args = ctx ? ["React", "ctx"] : ["React"];
  const vals = ctx ? [React9, ctx] : [React9];
  try {
    const factory = new Function(...args, `${code}
return Component;`);
    return factory(...vals);
  } catch (firstErr) {
    try {
      const transformed = transformJSX(code);
      if (transformed !== code) {
        const factory = new Function(...args, `${transformed}
return Component;`);
        return factory(...vals);
      }
    } catch {
    }
    try {
      const wrapped = code.includes("Component") ? code : `const Component = (props) => {
  return ${code}
};`;
      const transformed = transformJSX(wrapped);
      const factory = new Function(...args, `${transformed}
return Component;`);
      return factory(...vals);
    } catch {
    }
    console.error("[ClawKit] Failed to compile component:", firstErr);
    return null;
  }
}

// src/lib/plugins.ts
async function runBeforeGenerate(plugins, ctx) {
  let prompt = ctx.prompt;
  for (const plugin of plugins) {
    if (plugin.beforeGenerate) {
      prompt = await plugin.beforeGenerate({ ...ctx, prompt });
    }
  }
  return prompt;
}
async function runAfterGenerate(plugins, ctx) {
  let code = ctx.code;
  for (const plugin of plugins) {
    if (plugin.afterGenerate) {
      code = await plugin.afterGenerate({ ...ctx, code });
    }
  }
  return code;
}
async function runValidate(plugins, ctx) {
  for (const plugin of plugins) {
    if (plugin.validate) {
      const error = await plugin.validate(ctx);
      if (error) return `[${plugin.name}] ${error}`;
    }
  }
  return null;
}

// src/lib/smart-prompt.ts
function refinePrompt(prompt, slotId, slotConfig, hasExisting) {
  const trimmed = prompt.trim();
  if (trimmed.length > 80) return trimmed;
  const parts = [trimmed];
  if (slotConfig) {
    const slotWords = slotConfig.name.toLowerCase().split(/\s+/);
    const promptLower = trimmed.toLowerCase();
    const mentionsSlot = slotWords.some((w) => w.length > 3 && promptLower.includes(w));
    if (!mentionsSlot) {
      parts.push(`for the ${slotConfig.name} section`);
    }
  }
  const vaguePatterns = [
    [/^make it (better|nice|good|cool)$/i, "Improve the visual design with modern styling, better spacing, and polished typography"],
    [/^(dark|light) ?(mode|theme)?$/i, `Apply a ${trimmed.includes("dark") ? "dark" : "light"} color scheme with appropriate contrast and styling`],
    [/^(bigger|larger|smaller|compact)$/i, `Adjust the sizing to be ${trimmed.toLowerCase()} with proportional spacing`],
    [/^(colorful|bright|vibrant)$/i, "Add a vibrant, colorful design with gradients and accent colors"],
    [/^(minimal|clean|simple)$/i, "Create a minimal, clean design with plenty of whitespace and restrained typography"],
    [/^(modern|futuristic|sleek)$/i, "Design with a modern aesthetic \u2014 glassmorphism, subtle gradients, and sharp typography"]
  ];
  for (const [pattern, replacement] of vaguePatterns) {
    if (pattern.test(trimmed)) {
      return hasExisting ? `${replacement}. Modify the existing component.` : replacement;
    }
  }
  if (trimmed.length < 30 && !trimmed.includes("style")) {
    parts.push("with polished styling and good visual hierarchy");
  }
  if (hasExisting && !trimmed.toLowerCase().includes("new") && !trimmed.toLowerCase().includes("replace")) {
    parts.push("\u2014 modify the existing component, don't start from scratch");
  }
  return parts.join(" ");
}

// src/lib/share.ts
function encodeSharePayload(payload) {
  const json = JSON.stringify(payload);
  if (typeof btoa !== "undefined") {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json).toString("base64");
}
function decodeSharePayload(encoded) {
  try {
    let json;
    if (typeof atob !== "undefined") {
      json = decodeURIComponent(escape(atob(encoded)));
    } else {
      json = Buffer.from(encoded, "base64").toString("utf-8");
    }
    return JSON.parse(json);
  } catch {
    return null;
  }
}
async function generateShareUrl(payload, shareEndpoint) {
  if (shareEndpoint) {
    try {
      const res = await fetch(shareEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const { url } = await res.json();
        return url;
      }
    } catch {
    }
  }
  const encoded = encodeSharePayload(payload);
  const baseUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  return `${baseUrl}#clawkit=${encoded}`;
}
function parseShareFromUrl() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const match = hash.match(/#clawkit=(.+)/);
  if (!match) return null;
  return decodeSharePayload(match[1]);
}

// src/lib/context-bridge.ts
function createContextBridge(config = {}) {
  const endpoint = config.endpoint || "/api/clawkit/context";
  const cacheTtl = config.cacheTtlMs ?? 3e4;
  const cache = /* @__PURE__ */ new Map();
  async function call(type, name, args) {
    if (type === "query") {
      const cacheKey = `${name}:${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers
      },
      body: JSON.stringify({ type, name, args })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Context call failed: ${res.status}`);
    }
    const { data } = await res.json();
    if (type === "query" && cacheTtl > 0) {
      const cacheKey = `${name}:${JSON.stringify(args)}`;
      cache.set(cacheKey, { data, expiresAt: Date.now() + cacheTtl });
    }
    return data;
  }
  const queries = new Proxy({}, {
    get(_target, prop) {
      return (...args) => call("query", prop, args);
    }
  });
  const actions = new Proxy({}, {
    get(_target, prop) {
      return (...args) => call("action", prop, args);
    }
  });
  return {
    queries,
    actions,
    /** Clear the query cache */
    clearCache() {
      cache.clear();
    }
  };
}

// src/components/command-bar.tsx
import React3, { useCallback as useCallback2, useEffect, useRef, useState as useState2 } from "react";

// src/lib/suggestions.ts
function getSuggestions(slotId, slotConfig, input, hasExisting) {
  if (input.length > 0) {
    const all = [
      ...getSlotSuggestions(slotId, slotConfig),
      ...getGenericSuggestions(hasExisting)
    ];
    const lower = input.toLowerCase();
    return all.filter(
      (s) => s.text.toLowerCase().includes(lower) || s.category.includes(lower)
    ).slice(0, 5);
  }
  return [
    ...getSlotSuggestions(slotId, slotConfig).slice(0, 4),
    ...getGenericSuggestions(hasExisting).slice(0, 2)
  ];
}
function getSlotSuggestions(slotId, config) {
  const name = (config?.name ?? slotId ?? "").toLowerCase();
  if (name.includes("hero") || name.includes("banner")) {
    return [
      { text: "Gradient hero with animated background", category: "style", icon: "\u{1F3A8}" },
      { text: "Minimal hero with large typography", category: "style", icon: "\u2728" },
      { text: "Hero with product screenshot mockup", category: "content", icon: "\u{1F4F1}" },
      { text: "Split hero: text left, image right", category: "layout", icon: "\u{1F4D0}" },
      { text: "Hero with animated counter stats", category: "interactive", icon: "\u{1F4CA}" },
      { text: "Video background hero section", category: "style", icon: "\u{1F3AC}" }
    ];
  }
  if (name.includes("nav") || name.includes("header")) {
    return [
      { text: "Add a search bar to the navigation", category: "interactive", icon: "\u{1F50D}" },
      { text: "Sticky navbar with blur backdrop", category: "style", icon: "\u2728" },
      { text: "Add user avatar and dropdown menu", category: "interactive", icon: "\u{1F464}" },
      { text: "Breadcrumb navigation bar", category: "layout", icon: "\u{1F4D0}" },
      { text: "Mobile hamburger menu", category: "layout", icon: "\u{1F4F1}" }
    ];
  }
  if (name.includes("feature") || name.includes("grid")) {
    return [
      { text: "Bento grid layout with icons", category: "layout", icon: "\u{1F4D0}" },
      { text: "Feature comparison table", category: "content", icon: "\u{1F4CA}" },
      { text: "Animated feature cards on hover", category: "interactive", icon: "\u2728" },
      { text: "Icon grid with descriptions", category: "content", icon: "\u{1F3AF}" },
      { text: "Testimonials carousel", category: "content", icon: "\u{1F4AC}" }
    ];
  }
  if (name.includes("cta") || name.includes("action") || name.includes("pricing")) {
    return [
      { text: "Pricing table with 3 tiers", category: "content", icon: "\u{1F4B0}" },
      { text: "Newsletter signup with email input", category: "interactive", icon: "\u{1F4E7}" },
      { text: "Download CTA with platform buttons", category: "interactive", icon: "\u2B07\uFE0F" },
      { text: "Free trial countdown timer", category: "interactive", icon: "\u23F0" },
      { text: "Social proof CTA with logos", category: "content", icon: "\u{1F3E2}" }
    ];
  }
  if (name.includes("sidebar") || name.includes("widget")) {
    return [
      { text: "Live clock with timezone display", category: "interactive", icon: "\u{1F550}" },
      { text: "Activity feed with timestamps", category: "content", icon: "\u{1F4CB}" },
      { text: "Quick stats dashboard", category: "content", icon: "\u{1F4CA}" },
      { text: "Todo list widget", category: "interactive", icon: "\u2705" },
      { text: "Weather widget", category: "content", icon: "\u{1F324}\uFE0F" },
      { text: "Mini calendar widget", category: "interactive", icon: "\u{1F4C5}" }
    ];
  }
  if (name.includes("footer")) {
    return [
      { text: "Multi-column footer with links", category: "layout", icon: "\u{1F4D0}" },
      { text: "Footer with social media icons", category: "content", icon: "\u{1F517}" },
      { text: "Minimal footer with copyright", category: "style", icon: "\u2728" }
    ];
  }
  return [];
}
function getGenericSuggestions(hasExisting) {
  if (hasExisting) {
    return [
      { text: "Make it more colorful", category: "style", icon: "\u{1F3A8}" },
      { text: "Add a dark mode toggle", category: "interactive", icon: "\u{1F319}" },
      { text: "Make it more compact", category: "layout", icon: "\u{1F4D0}" },
      { text: "Add loading animations", category: "interactive", icon: "\u2728" },
      { text: "Make the text larger", category: "style", icon: "\u{1F524}" }
    ];
  }
  return [
    { text: "Something minimal and clean", category: "style", icon: "\u2728" },
    { text: "Dark glassmorphism design", category: "style", icon: "\u{1F5A4}" },
    { text: "Colorful gradient style", category: "style", icon: "\u{1F308}" }
  ];
}

// src/components/diff-view.tsx
import { useMemo } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function DiffView({
  oldCode,
  newCode,
  maxHeight = 250
}) {
  const diff = useMemo(() => computeDiff(oldCode, newCode), [oldCode, newCode]);
  if (diff.length === 0) return null;
  const addCount = diff.filter((d) => d.type === "add").length;
  const removeCount = diff.filter((d) => d.type === "remove").length;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        borderRadius: "6px",
        border: "1px solid var(--ck-border)",
        overflow: "hidden",
        fontFamily: "monospace",
        fontSize: "11px"
      },
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              background: "var(--ck-bg-secondary)",
              borderBottom: "1px solid var(--ck-border)"
            },
            children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  style: {
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "var(--ck-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  },
                  children: "Changes"
                }
              ),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
                /* @__PURE__ */ jsxs("span", { style: { color: "#22c55e", fontSize: "11px" }, children: [
                  "+",
                  addCount
                ] }),
                /* @__PURE__ */ jsxs("span", { style: { color: "#ef4444", fontSize: "11px" }, children: [
                  "-",
                  removeCount
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { maxHeight, overflowY: "auto", background: "var(--ck-bg)" }, children: diff.map((line, i) => /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              display: "flex",
              background: line.type === "add" ? "rgba(34, 197, 94, 0.08)" : line.type === "remove" ? "rgba(239, 68, 68, 0.08)" : "transparent",
              borderLeft: `3px solid ${line.type === "add" ? "#22c55e" : line.type === "remove" ? "#ef4444" : "transparent"}`
            },
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    width: "32px",
                    flexShrink: 0,
                    textAlign: "right",
                    padding: "1px 6px 1px 0",
                    color: "var(--ck-text-muted)",
                    opacity: 0.4,
                    userSelect: "none",
                    fontSize: "10px"
                  },
                  children: line.lineNum.old ?? ""
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    width: "32px",
                    flexShrink: 0,
                    textAlign: "right",
                    padding: "1px 6px 1px 0",
                    color: "var(--ck-text-muted)",
                    opacity: 0.4,
                    userSelect: "none",
                    fontSize: "10px"
                  },
                  children: line.lineNum.new ?? ""
                }
              ),
              /* @__PURE__ */ jsx(
                "span",
                {
                  style: {
                    width: "16px",
                    flexShrink: 0,
                    textAlign: "center",
                    color: line.type === "add" ? "#22c55e" : line.type === "remove" ? "#ef4444" : "var(--ck-text-muted)",
                    fontWeight: 600,
                    userSelect: "none"
                  },
                  children: line.type === "add" ? "+" : line.type === "remove" ? "-" : " "
                }
              ),
              /* @__PURE__ */ jsx(
                "pre",
                {
                  style: {
                    margin: 0,
                    padding: "1px 8px 1px 0",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    color: line.type === "same" ? "var(--ck-text-muted)" : "var(--ck-text)"
                  },
                  children: line.content
                }
              )
            ]
          },
          i
        )) })
      ]
    }
  );
}
function computeDiff(oldText, newText) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from(
    { length: m + 1 },
    () => new Array(n + 1).fill(0)
  );
  for (let i2 = 1; i2 <= m; i2++) {
    for (let j2 = 1; j2 <= n; j2++) {
      if (oldLines[i2 - 1] === newLines[j2 - 1]) {
        dp[i2][j2] = dp[i2 - 1][j2 - 1] + 1;
      } else {
        dp[i2][j2] = Math.max(dp[i2 - 1][j2], dp[i2][j2 - 1]);
      }
    }
  }
  const result = [];
  let i = m, j = n;
  const stack = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({
        type: "same",
        content: oldLines[i - 1],
        lineNum: { old: i, new: j }
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: "add",
        content: newLines[j - 1],
        lineNum: { new: j }
      });
      j--;
    } else {
      stack.push({
        type: "remove",
        content: oldLines[i - 1],
        lineNum: { old: i }
      });
      i--;
    }
  }
  stack.reverse();
  return stack;
}

// src/components/style-editor.tsx
import { useState, useCallback } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var STYLE_PRESETS = [
  { key: "accent", label: "Accent Color", type: "color", cssVar: "--ck-accent" },
  { key: "bg", label: "Background", type: "color", cssVar: "--ck-bg" },
  { key: "text", label: "Text Color", type: "color", cssVar: "--ck-text" },
  { key: "radius", label: "Roundness", type: "select", options: ["0px", "4px", "8px", "12px", "16px", "999px"], cssVar: "--ck-radius" },
  { key: "font", label: "Font", type: "select", options: [
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    '"Inter", sans-serif',
    '"JetBrains Mono", monospace',
    'Georgia, "Times New Roman", serif'
  ], cssVar: "--ck-font" }
];
var COLOR_PRESETS = [
  { name: "Default", accent: "hsl(0 0% 98%)", bg: "hsl(0 0% 3.9%)" },
  { name: "Blue", accent: "hsl(217 91% 60%)", bg: "hsl(222 47% 11%)" },
  { name: "Purple", accent: "hsl(262 83% 58%)", bg: "hsl(263 70% 8%)" },
  { name: "Green", accent: "hsl(142 71% 45%)", bg: "hsl(144 61% 6%)" },
  { name: "Orange", accent: "hsl(25 95% 53%)", bg: "hsl(20 50% 7%)" },
  { name: "Rose", accent: "hsl(346 77% 50%)", bg: "hsl(345 50% 7%)" }
];
function StyleEditor({
  onApply,
  currentOverrides
}) {
  const [overrides, setOverrides] = useState(
    currentOverrides ?? {}
  );
  const [expanded, setExpanded] = useState(false);
  const updateOverride = useCallback((cssVar, value) => {
    setOverrides((prev) => ({ ...prev, [cssVar]: value }));
  }, []);
  const applyPreset = useCallback((preset) => {
    const next = {
      ...overrides,
      "--ck-accent": preset.accent,
      "--ck-bg": preset.bg
    };
    setOverrides(next);
    onApply(next);
  }, [overrides, onApply]);
  return /* @__PURE__ */ jsxs2("div", { style: { padding: "12px", fontFamily: "var(--ck-font)" }, children: [
    /* @__PURE__ */ jsx2("div", { style: {
      fontSize: "10px",
      fontWeight: 600,
      color: "var(--ck-text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "8px"
    }, children: "Quick Theme" }),
    /* @__PURE__ */ jsx2("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }, children: COLOR_PRESETS.map((preset) => /* @__PURE__ */ jsxs2(
      "button",
      {
        onClick: () => applyPreset(preset),
        style: {
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "6px",
          border: "1px solid var(--ck-border)",
          background: "var(--ck-bg-secondary)",
          cursor: "pointer",
          fontFamily: "var(--ck-font)",
          fontSize: "11px",
          color: "var(--ck-text)",
          transition: "all 0.15s"
        },
        onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--ck-accent)",
        onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--ck-border)",
        children: [
          /* @__PURE__ */ jsx2("div", { style: {
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: preset.accent,
            border: "1px solid rgba(255,255,255,0.1)"
          } }),
          preset.name
        ]
      },
      preset.name
    )) }),
    /* @__PURE__ */ jsxs2(
      "button",
      {
        onClick: () => setExpanded((p) => !p),
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--ck-text-muted)",
          fontSize: "11px",
          fontFamily: "var(--ck-font)",
          padding: "4px 0",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        },
        children: [
          expanded ? "\u25BE" : "\u25B8",
          " Advanced"
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxs2("div", { style: { marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }, children: [
      STYLE_PRESETS.map((style) => /* @__PURE__ */ jsxs2("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsx2("label", { style: {
          fontSize: "12px",
          color: "var(--ck-text-muted)",
          width: "100px",
          flexShrink: 0
        }, children: style.label }),
        style.type === "color" ? /* @__PURE__ */ jsx2(
          "input",
          {
            type: "color",
            value: overrides[style.cssVar] ?? "#ffffff",
            onChange: (e) => updateOverride(style.cssVar, e.target.value),
            style: { width: "32px", height: "24px", border: "none", borderRadius: "4px", cursor: "pointer", padding: 0 }
          }
        ) : style.type === "select" ? /* @__PURE__ */ jsxs2(
          "select",
          {
            value: overrides[style.cssVar] ?? "",
            onChange: (e) => updateOverride(style.cssVar, e.target.value),
            style: {
              flex: 1,
              padding: "4px 8px",
              borderRadius: "4px",
              background: "var(--ck-bg-secondary)",
              border: "1px solid var(--ck-border)",
              color: "var(--ck-text)",
              fontSize: "11px",
              fontFamily: "var(--ck-font)"
            },
            children: [
              /* @__PURE__ */ jsx2("option", { value: "", children: "Default" }),
              style.options?.map((opt) => /* @__PURE__ */ jsx2("option", { value: opt, children: opt.length > 30 ? opt.split(",")[0].replace(/"/g, "") : opt }, opt))
            ]
          }
        ) : null
      ] }, style.key)),
      /* @__PURE__ */ jsx2(
        "button",
        {
          onClick: () => onApply(overrides),
          style: {
            marginTop: "4px",
            padding: "8px 16px",
            borderRadius: "var(--ck-radius)",
            background: "var(--ck-accent)",
            color: "var(--ck-accent-text)",
            border: "none",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--ck-font)",
            alignSelf: "flex-start"
          },
          children: "Apply Styles"
        }
      )
    ] })
  ] });
}

// src/components/command-bar.tsx
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var STAGE_LABELS = {
  idle: "",
  analyzing: "Analyzing your request...",
  generating: "Generating component...",
  streaming: "Writing code...",
  compiling: "Compiling...",
  done: "Done!",
  error: "Something went wrong"
};
function useIsMobile() {
  const [isMobile, setIsMobile] = useState2(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}
function CommandBar() {
  const {
    isOpen,
    close,
    generate,
    generateMultiSlot,
    applyTemplate,
    exportComponent,
    isGenerating,
    generationStage,
    selectedSlot,
    components,
    lastServerMutation,
    slots,
    templates,
    resetSlot,
    rollback,
    streamingCode,
    config,
    rateLimitRemaining,
    shareComponent,
    createSlot,
    dynamicSlotIds,
    applyStyleOverrides,
    styleOverrides
  } = useClawKit();
  const [input, setInput] = useState2("");
  const [view, setView] = useState2("prompt");
  const [pickedSlot, setPickedSlot] = useState2(null);
  const [showPreview, setShowPreview] = useState2(false);
  const [showDiff, setShowDiff] = useState2(false);
  const [templateFilter, setTemplateFilter] = useState2("");
  const [exportedCode, setExportedCode] = useState2(null);
  const [focusedIndex, setFocusedIndex] = useState2(-1);
  const inputRef = useRef(null);
  const isMobile = useIsMobile();
  const activeSlot = selectedSlot ?? pickedSlot;
  const slotEntries = Object.entries(slots);
  const activeComponent = components.find(
    (c) => c.slotId === activeSlot
  );
  const suggestions = getSuggestions(
    activeSlot,
    activeSlot ? slots[activeSlot] : void 0,
    input,
    !!activeComponent
  );
  const isMultiSlotPrompt = (prompt) => {
    if (!config.multiSlot) return false;
    const keywords = [
      "everything",
      "all sections",
      "whole page",
      "entire page",
      "all slots",
      "every section",
      "complete redesign"
    ];
    return keywords.some((k) => prompt.toLowerCase().includes(k));
  };
  useEffect(() => {
    if (isOpen) {
      setInput("");
      setView("prompt");
      setPickedSlot(selectedSlot ?? "__new__");
      setShowPreview(false);
      setExportedCode(null);
      setTemplateFilter("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && isOpen) close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);
  useEffect(() => {
    if (generationStage === "streaming") {
      setView("streaming");
    }
  }, [generationStage]);
  const handleSubmit = useCallback2(async () => {
    if (!input.trim() || isGenerating) return;
    try {
      if (isMultiSlotPrompt(input)) {
        await generateMultiSlot(input.trim());
      } else {
        let targetSlot = activeSlot;
        if (targetSlot === "__new__") {
          const words = input.trim().split(/\s+/).slice(0, 4).join(" ");
          const name = words.length > 30 ? words.slice(0, 30) + "\u2026" : words;
          targetSlot = createSlot(name, input.trim());
          setPickedSlot(targetSlot);
        }
        await generate(input.trim(), targetSlot ?? void 0);
      }
      setView("preview");
    } catch {
    }
  }, [input, isGenerating, generate, generateMultiSlot, activeSlot, createSlot]);
  const handleKeyDown = useCallback2(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          setInput(suggestions[focusedIndex].text);
          setFocusedIndex(-1);
          return;
        }
        handleSubmit();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!activeSlot && !input) {
          const max = Object.keys(slots).length - 1;
          setFocusedIndex((prev) => Math.min(prev + 1, max));
        } else if (suggestions.length > 0) {
          setFocusedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Tab" && suggestions.length > 0 && focusedIndex >= 0) {
        e.preventDefault();
        setInput(suggestions[focusedIndex].text);
        setFocusedIndex(-1);
      }
    },
    [handleSubmit, focusedIndex, suggestions, activeSlot, input, slots]
  );
  useEffect(() => {
    setFocusedIndex(-1);
  }, [input]);
  const handleExport = useCallback2(() => {
    if (!activeSlot) return;
    const code = exportComponent(activeSlot);
    if (code) {
      setExportedCode(code);
      navigator.clipboard?.writeText(code).catch(() => {
      });
    }
  }, [activeSlot, exportComponent]);
  if (!isOpen) return null;
  const containerStyle = isMobile ? {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    animation: "ck-slide-up-mobile 0.25s ease-out"
  } : {
    position: "fixed",
    top: "15%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(620px, 90vw)",
    zIndex: 99999,
    animation: "ck-slide-up 0.2s ease-out"
  };
  const panelStyle = {
    background: "var(--ck-bg)",
    border: isMobile ? "none" : "1px solid var(--ck-border)",
    borderRadius: isMobile ? "16px 16px 0 0" : "var(--ck-radius)",
    boxShadow: "var(--ck-shadow)",
    overflow: "hidden",
    fontFamily: "var(--ck-font)"
  };
  const filteredTemplates = templates.filter((t) => {
    if (activeSlot && t.category !== activeSlot) return false;
    if (templateFilter) {
      const q = templateFilter.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags?.some((tag) => tag.toLowerCase().includes(q));
    }
    return true;
  });
  return /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsx3(
      "div",
      {
        onClick: close,
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 99998,
          animation: "ck-fade-in 0.15s ease-out"
        }
      }
    ),
    /* @__PURE__ */ jsx3("div", { style: containerStyle, children: /* @__PURE__ */ jsxs3("div", { style: panelStyle, children: [
      isMobile && /* @__PURE__ */ jsx3("div", { style: { display: "flex", justifyContent: "center", padding: "8px 0 4px" }, children: /* @__PURE__ */ jsx3("div", { style: { width: "36px", height: "4px", borderRadius: "2px", background: "var(--ck-border)" } }) }),
      /* @__PURE__ */ jsxs3(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            padding: isMobile ? "12px 16px" : "14px 16px",
            borderBottom: "1px solid var(--ck-border)",
            gap: "10px"
          },
          children: [
            /* @__PURE__ */ jsxs3("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "var(--ck-text-muted)", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0 }, children: [
              /* @__PURE__ */ jsx3("circle", { cx: "11", cy: "11", r: "8" }),
              /* @__PURE__ */ jsx3("path", { d: "m21 21-4.3-4.3" })
            ] }),
            activeSlot && /* @__PURE__ */ jsxs3(
              "span",
              {
                style: {
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "var(--ck-bg-hover)",
                  border: "1px solid var(--ck-border)",
                  color: "var(--ck-text-muted)",
                  fontSize: "11px",
                  fontFamily: "var(--ck-font)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  cursor: "pointer"
                },
                onClick: () => setPickedSlot(null),
                title: "Click to change target",
                children: [
                  activeSlot === "__new__" ? "New Component" : slots[activeSlot]?.name ?? activeSlot,
                  " \xD7"
                ]
              }
            ),
            /* @__PURE__ */ jsx3(
              "input",
              {
                ref: inputRef,
                value: input,
                onChange: (e) => setInput(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: activeSlot ? "Describe what you want..." : "Describe what you want to build",
                disabled: isGenerating,
                style: {
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--ck-text)",
                  fontSize: isMobile ? "16px" : "15px",
                  fontFamily: "var(--ck-font)",
                  letterSpacing: "-0.01em",
                  minWidth: 0
                }
              }
            ),
            !isMobile && /* @__PURE__ */ jsx3("kbd", { style: {
              padding: "2px 6px",
              borderRadius: "4px",
              background: "var(--ck-bg-secondary)",
              border: "1px solid var(--ck-border)",
              color: "var(--ck-text-muted)",
              fontSize: "11px",
              fontFamily: "var(--ck-font)",
              lineHeight: "1.4",
              flexShrink: 0
            }, children: "ESC" })
          ]
        }
      ),
      activeSlot && !isGenerating && (view === "prompt" || view === "templates" || view === "styles") && /* @__PURE__ */ jsxs3("div", { style: {
        display: "flex",
        gap: "0",
        borderBottom: "1px solid var(--ck-border)"
      }, children: [
        /* @__PURE__ */ jsx3(TabButton, { active: view === "prompt", onClick: () => setView("prompt"), children: "Generate" }),
        templates.length > 0 && /* @__PURE__ */ jsx3(TabButton, { active: view === "templates", onClick: () => setView("templates"), children: "Templates" }),
        /* @__PURE__ */ jsx3(TabButton, { active: view === "styles", onClick: () => setView("styles"), children: "Styles" })
      ] }),
      /* @__PURE__ */ jsx3("div", { style: { maxHeight: isMobile ? "60vh" : "400px", overflowY: "auto" }, children: isGenerating && view !== "streaming" ? (
        /* ─── Loading state with stages ─── */
        /* @__PURE__ */ jsxs3("div", { style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          gap: "16px"
        }, children: [
          /* @__PURE__ */ jsx3("div", { style: {
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2px solid var(--ck-border)",
            borderTopColor: "var(--ck-accent)",
            animation: "ck-spin 0.8s linear infinite"
          } }),
          /* @__PURE__ */ jsx3("span", { style: { color: "var(--ck-text-muted)", fontSize: "13px", animation: "ck-fade-in 0.3s ease-out" }, children: STAGE_LABELS[generationStage] }),
          /* @__PURE__ */ jsx3("div", { style: { display: "flex", gap: "6px" }, children: ["analyzing", "generating", "compiling"].map((stage, i) => /* @__PURE__ */ jsx3("div", { style: {
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: generationStage === stage || ["analyzing", "generating", "compiling"].indexOf(generationStage) > i ? "var(--ck-accent)" : "var(--ck-border)",
            transition: "background 0.3s"
          } }, stage)) }),
          isMultiSlotPrompt(input) && /* @__PURE__ */ jsx3("span", { style: { color: "var(--ck-text-muted)", fontSize: "11px" }, children: "Updating all sections..." })
        ] })
      ) : view === "streaming" ? (
        /* ─── Streaming code view ─── */
        /* @__PURE__ */ jsxs3("div", { style: { padding: "16px" }, children: [
          /* @__PURE__ */ jsxs3("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px"
          }, children: [
            /* @__PURE__ */ jsx3("div", { style: {
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
              animation: "ck-pulse 1s infinite"
            } }),
            /* @__PURE__ */ jsx3("span", { style: { color: "var(--ck-text)", fontSize: "13px", fontWeight: 500 }, children: "Writing code..." }),
            /* @__PURE__ */ jsxs3("span", { style: { color: "var(--ck-text-muted)", fontSize: "11px", marginLeft: "auto" }, children: [
              streamingCode.length,
              " chars"
            ] })
          ] }),
          /* @__PURE__ */ jsx3("pre", { style: {
            padding: "12px",
            borderRadius: "6px",
            background: "var(--ck-bg-secondary)",
            border: "1px solid var(--ck-border)",
            color: "var(--ck-text-muted)",
            fontSize: "11px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            maxHeight: "200px",
            overflowY: "auto"
          }, children: streamingCode || "..." }),
          /* @__PURE__ */ jsx3(StreamingPreview, { code: streamingCode })
        ] })
      ) : view === "preview" ? (
        /* ─── Preview / Success ─── */
        /* @__PURE__ */ jsxs3("div", { style: { padding: "16px" }, children: [
          /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }, children: [
            /* @__PURE__ */ jsx3("div", { style: {
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: generationStage === "error" ? "#ef4444" : "#22c55e"
            } }),
            /* @__PURE__ */ jsx3("span", { style: { color: "var(--ck-text)", fontSize: "14px", fontWeight: 500 }, children: generationStage === "error" ? "Something went wrong" : "Changes applied" })
          ] }),
          activeComponent && showPreview && /* @__PURE__ */ jsxs3("div", { style: {
            marginBottom: "12px",
            padding: "16px",
            borderRadius: "8px",
            background: "var(--ck-bg-secondary)",
            border: "1px solid var(--ck-border)",
            minHeight: "80px",
            overflow: "hidden"
          }, children: [
            /* @__PURE__ */ jsx3("div", { style: {
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--ck-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px"
            }, children: "Preview" }),
            /* @__PURE__ */ jsx3(LivePreview, { code: activeComponent.code })
          ] }),
          lastServerMutation && lastServerMutation.files?.length > 0 && /* @__PURE__ */ jsxs3("div", { style: {
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "6px",
            background: "var(--ck-bg-secondary)",
            border: "1px solid var(--ck-border)"
          }, children: [
            /* @__PURE__ */ jsx3("div", { style: {
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--ck-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px"
            }, children: "What changed" }),
            lastServerMutation.files.map((f, i) => /* @__PURE__ */ jsxs3("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 0",
              fontSize: "12px",
              fontFamily: "monospace"
            }, children: [
              /* @__PURE__ */ jsx3("span", { style: {
                color: f.action === "create" ? "#22c55e" : f.action === "delete" ? "#ef4444" : "#f59e0b",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                width: "48px"
              }, children: f.action }),
              /* @__PURE__ */ jsx3("span", { style: { color: "var(--ck-text)" }, children: f.path })
            ] }, i))
          ] }),
          exportedCode && /* @__PURE__ */ jsxs3("div", { style: {
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "6px",
            background: "var(--ck-bg-secondary)",
            border: "1px solid var(--ck-border)"
          }, children: [
            /* @__PURE__ */ jsxs3("div", { style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px"
            }, children: [
              /* @__PURE__ */ jsx3("div", { style: {
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--ck-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }, children: "Exported Code" }),
              /* @__PURE__ */ jsx3("span", { style: { fontSize: "11px", color: "#22c55e" }, children: "Copied to clipboard!" })
            ] }),
            /* @__PURE__ */ jsx3("pre", { style: {
              fontSize: "11px",
              fontFamily: "monospace",
              color: "var(--ck-text-muted)",
              whiteSpace: "pre-wrap",
              maxHeight: "150px",
              overflowY: "auto",
              margin: 0
            }, children: exportedCode })
          ] }),
          showDiff && activeComponent && activeComponent.history.length > 0 && /* @__PURE__ */ jsx3("div", { style: { marginBottom: "12px" }, children: /* @__PURE__ */ jsx3(
            DiffView,
            {
              oldCode: activeComponent.history[activeComponent.history.length - 1].code,
              newCode: activeComponent.code
            }
          ) }),
          /* @__PURE__ */ jsx3("p", { style: { color: "var(--ck-text-muted)", fontSize: "13px", margin: "0 0 16px 0", lineHeight: 1.5 }, children: "Your changes are live. You can iterate or close." }),
          /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsx3(
              CKButton,
              {
                onClick: () => {
                  setView("prompt");
                  setInput("");
                  setExportedCode(null);
                  setTimeout(() => inputRef.current?.focus(), 50);
                },
                variant: "secondary",
                children: "Modify"
              }
            ),
            /* @__PURE__ */ jsx3(
              CKButton,
              {
                onClick: () => setShowPreview((p) => !p),
                variant: "secondary",
                children: showPreview ? "Hide Preview" : "Preview"
              }
            ),
            /* @__PURE__ */ jsx3(CKButton, { onClick: handleExport, variant: "secondary", children: "Export" }),
            activeSlot && /* @__PURE__ */ jsx3(
              CKButton,
              {
                onClick: () => shareComponent(activeSlot),
                variant: "secondary",
                children: "Share"
              }
            ),
            activeComponent && activeComponent.history.length > 0 && /* @__PURE__ */ jsx3(
              CKButton,
              {
                onClick: () => setShowDiff((p) => !p),
                variant: "secondary",
                children: showDiff ? "Hide Diff" : "Diff"
              }
            ),
            activeComponent && activeComponent.history.length > 0 && /* @__PURE__ */ jsx3(
              CKButton,
              {
                onClick: () => {
                  rollback(activeComponent.id);
                  setView("prompt");
                },
                variant: "secondary",
                children: "\u21A9 Undo"
              }
            ),
            activeSlot && activeComponent && /* @__PURE__ */ jsx3(
              CKButton,
              {
                onClick: () => {
                  resetSlot(activeSlot);
                  close();
                },
                variant: "secondary",
                children: "Reset"
              }
            ),
            /* @__PURE__ */ jsx3(CKButton, { onClick: close, variant: "primary", children: "Done" })
          ] })
        ] })
      ) : view === "styles" ? (
        /* ─── Style Quick Editor ─── */
        /* @__PURE__ */ jsx3(
          StyleEditor,
          {
            onApply: applyStyleOverrides,
            currentOverrides: styleOverrides
          }
        )
      ) : view === "templates" ? (
        /* ─── Template Gallery ─── */
        /* @__PURE__ */ jsxs3("div", { style: { padding: "8px" }, children: [
          /* @__PURE__ */ jsx3("div", { style: { padding: "8px 8px 4px" }, children: /* @__PURE__ */ jsx3(
            "input",
            {
              value: templateFilter,
              onChange: (e) => setTemplateFilter(e.target.value),
              placeholder: "Search templates...",
              style: {
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                background: "var(--ck-bg-secondary)",
                border: "1px solid var(--ck-border)",
                color: "var(--ck-text)",
                fontSize: "13px",
                fontFamily: "var(--ck-font)",
                outline: "none"
              }
            }
          ) }),
          filteredTemplates.length === 0 ? /* @__PURE__ */ jsx3("div", { style: { padding: "24px 16px", textAlign: "center" }, children: /* @__PURE__ */ jsxs3("p", { style: { color: "var(--ck-text-muted)", fontSize: "13px", margin: 0 }, children: [
            "No templates available",
            activeSlot ? ` for ${slots[activeSlot]?.name}` : "",
            "."
          ] }) }) : /* @__PURE__ */ jsx3("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "8px" }, children: filteredTemplates.map((t) => /* @__PURE__ */ jsxs3(
            "button",
            {
              onClick: () => {
                if (activeSlot) {
                  applyTemplate(t, activeSlot);
                  setView("preview");
                }
              },
              style: {
                textAlign: "left",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--ck-border)",
                background: "var(--ck-bg-secondary)",
                cursor: "pointer",
                fontFamily: "var(--ck-font)",
                transition: "all 0.15s"
              },
              onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--ck-accent)",
              onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--ck-border)",
              children: [
                /* @__PURE__ */ jsx3("div", { style: { color: "var(--ck-text)", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }, children: t.name }),
                t.description && /* @__PURE__ */ jsx3("div", { style: { color: "var(--ck-text-muted)", fontSize: "11px", lineHeight: 1.4 }, children: t.description }),
                t.tags && /* @__PURE__ */ jsx3("div", { style: { display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }, children: t.tags.map((tag) => /* @__PURE__ */ jsx3("span", { style: {
                  padding: "1px 6px",
                  borderRadius: "3px",
                  fontSize: "10px",
                  background: "var(--ck-bg-hover)",
                  color: "var(--ck-text-muted)"
                }, children: tag }, tag)) })
              ]
            },
            t.id
          )) })
        ] })
      ) : (
        /* ─── Prompt view ─── */
        /* @__PURE__ */ jsxs3(Fragment, { children: [
          components.length > 0 && !input && activeSlot && /* @__PURE__ */ jsxs3("div", { style: { padding: "8px" }, children: [
            /* @__PURE__ */ jsx3("div", { style: {
              padding: "6px 8px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--ck-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }, children: "Current customization" }),
            components.filter((c) => c.slotId === activeSlot).map((c) => /* @__PURE__ */ jsxs3("div", { style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: "6px"
            }, children: [
              /* @__PURE__ */ jsxs3("div", { children: [
                /* @__PURE__ */ jsxs3("div", { style: { color: "var(--ck-text)", fontSize: "13px" }, children: [
                  '"',
                  c.prompt,
                  '"'
                ] }),
                /* @__PURE__ */ jsxs3("div", { style: { color: "var(--ck-text-muted)", fontSize: "11px", marginTop: "2px" }, children: [
                  c.history.length,
                  " version",
                  c.history.length !== 1 ? "s" : "",
                  " \xB7 ",
                  /* @__PURE__ */ jsx3(
                    "span",
                    {
                      style: { cursor: "pointer", textDecoration: "underline" },
                      onClick: () => {
                        setShowPreview(true);
                        setView("preview");
                      },
                      children: "preview"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: "4px" }, children: [
                c.history.length > 0 && /* @__PURE__ */ jsx3(CKButton, { onClick: () => rollback(c.id), variant: "ghost", size: "sm", children: "\u21A9" }),
                /* @__PURE__ */ jsx3(CKButton, { onClick: () => resetSlot(c.slotId), variant: "ghost", size: "sm", children: "\u2715" })
              ] })
            ] }, c.id))
          ] }),
          !input && /* @__PURE__ */ jsxs3("div", { style: { padding: "8px" }, children: [
            !activeSlot && slotEntries.length > 0 && /* @__PURE__ */ jsxs3(Fragment, { children: [
              /* @__PURE__ */ jsx3("div", { style: {
                padding: "6px 8px",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--ck-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }, children: "Pick a section or create something new" }),
              slotEntries.map(([id, cfg]) => /* @__PURE__ */ jsxs3(
                "button",
                {
                  onClick: () => {
                    setPickedSlot(id);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  },
                  style: {
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--ck-font)",
                    transition: "background 0.1s"
                  },
                  onMouseEnter: (e) => e.currentTarget.style.background = "var(--ck-bg-hover)",
                  onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
                  children: [
                    /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                      /* @__PURE__ */ jsx3("div", { style: { color: "var(--ck-text)", fontSize: "13px", fontWeight: 500 }, children: cfg.name }),
                      components.find((c) => c.slotId === id) && /* @__PURE__ */ jsx3("span", { style: {
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#22c55e"
                      } })
                    ] }),
                    cfg.description && /* @__PURE__ */ jsx3("div", { style: { color: "var(--ck-text-muted)", fontSize: "12px", marginTop: "2px" }, children: cfg.description })
                  ]
                },
                id
              )),
              /* @__PURE__ */ jsx3("div", { style: { borderTop: "1px solid var(--ck-border)", margin: "4px 0", padding: "4px 0" } }),
              /* @__PURE__ */ jsxs3(
                "button",
                {
                  onClick: () => {
                    setPickedSlot("__new__");
                    setTimeout(() => inputRef.current?.focus(), 50);
                  },
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--ck-font)",
                    transition: "background 0.1s"
                  },
                  onMouseEnter: (e) => e.currentTarget.style.background = "var(--ck-bg-hover)",
                  onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
                  children: [
                    /* @__PURE__ */ jsx3("span", { style: { fontSize: "16px", color: "var(--ck-accent)" }, children: "\uFF0B" }),
                    /* @__PURE__ */ jsxs3("div", { children: [
                      /* @__PURE__ */ jsx3("div", { style: { color: "var(--ck-accent)", fontSize: "13px", fontWeight: 500 }, children: "Create new component" }),
                      /* @__PURE__ */ jsx3("div", { style: { color: "var(--ck-text-muted)", fontSize: "12px", marginTop: "2px" }, children: "Describe anything \u2014 a widget, chart, form, etc." })
                    ] })
                  ]
                }
              )
            ] }),
            activeSlot && !components.find((c) => c.slotId === activeSlot) && /* @__PURE__ */ jsx3("div", { style: { padding: "24px 16px", textAlign: "center" }, children: /* @__PURE__ */ jsx3("p", { style: { color: "var(--ck-text-muted)", fontSize: "13px", margin: 0, lineHeight: 1.6 }, children: "Describe what you want \u2014 just type and hit Enter." }) })
          ] }),
          activeSlot && input.length < 40 && suggestions.length > 0 && /* @__PURE__ */ jsxs3("div", { style: { padding: "4px 8px" }, children: [
            /* @__PURE__ */ jsx3("div", { style: {
              padding: "4px 8px",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--ck-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }, children: "Suggestions" }),
            suggestions.slice(0, 5).map((s, i) => /* @__PURE__ */ jsxs3(
              "button",
              {
                onClick: () => {
                  setInput(s.text);
                  setFocusedIndex(-1);
                  setTimeout(() => inputRef.current?.focus(), 50);
                },
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "none",
                  background: focusedIndex === i ? "var(--ck-bg-hover)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--ck-font)",
                  transition: "background 0.1s"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "var(--ck-bg-hover)";
                  setFocusedIndex(i);
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "transparent";
                },
                children: [
                  /* @__PURE__ */ jsx3("span", { style: { fontSize: "14px", width: "20px", textAlign: "center" }, children: s.icon }),
                  /* @__PURE__ */ jsx3("span", { style: { color: "var(--ck-text)", fontSize: "12px" }, children: s.text }),
                  /* @__PURE__ */ jsx3("span", { style: {
                    marginLeft: "auto",
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    background: "var(--ck-bg-secondary)",
                    color: "var(--ck-text-muted)"
                  }, children: s.category })
                ]
              },
              s.text
            ))
          ] }),
          input && isMultiSlotPrompt(input) && config.multiSlot && /* @__PURE__ */ jsx3("div", { style: {
            margin: "0 8px 8px",
            padding: "8px 12px",
            borderRadius: "6px",
            background: "var(--ck-bg-secondary)",
            border: "1px solid var(--ck-border)"
          }, children: /* @__PURE__ */ jsxs3("span", { style: { color: "var(--ck-text-muted)", fontSize: "12px" }, children: [
            "\u2728 This will update ",
            /* @__PURE__ */ jsxs3("strong", { style: { color: "var(--ck-text)" }, children: [
              "all ",
              slotEntries.length,
              " sections"
            ] })
          ] }) })
        ] })
      ) }),
      /* @__PURE__ */ jsxs3("div", { style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "12px 16px 24px" : "10px 16px",
        borderTop: "1px solid var(--ck-border)"
      }, children: [
        /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
          /* @__PURE__ */ jsx3("span", { style: { fontSize: "11px", color: "var(--ck-text-muted)", opacity: 0.5 }, children: "ClawKit" }),
          rateLimitRemaining < Infinity && rateLimitRemaining <= 3 && /* @__PURE__ */ jsxs3("span", { style: { fontSize: "10px", color: rateLimitRemaining === 0 ? "#ef4444" : "#f59e0b" }, children: [
            rateLimitRemaining,
            " left"
          ] })
        ] }),
        input.trim() && !isGenerating && /* @__PURE__ */ jsx3(CKButton, { onClick: handleSubmit, variant: "primary", size: "sm", children: "Generate \u21B5" }),
        !input.trim() && !isGenerating && /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: "4px", alignItems: "center" }, children: [
          /* @__PURE__ */ jsx3("kbd", { style: {
            padding: "2px 6px",
            borderRadius: "4px",
            background: "var(--ck-bg-secondary)",
            border: "1px solid var(--ck-border)",
            color: "var(--ck-text-muted)",
            fontSize: "11px",
            fontFamily: "var(--ck-font)"
          }, children: "\u21B5" }),
          /* @__PURE__ */ jsx3("span", { style: { color: "var(--ck-text-muted)", fontSize: "11px" }, children: "to generate" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx3("style", { children: `
        @keyframes ck-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ck-slide-up { from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.98); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        @keyframes ck-slide-up-mobile { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes ck-spin { to { transform: rotate(360deg); } }
        @keyframes ck-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      ` })
  ] });
}
function LivePreview({ code }) {
  const { ctxBridge } = useClawKit();
  const [rendered, setRendered] = useState2(null);
  const [error, setError] = useState2(null);
  useEffect(() => {
    try {
      const fn = compileComponent(code, React3, ctxBridge);
      if (fn) {
        setRendered(React3.createElement(fn, {}));
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  }, [code, ctxBridge]);
  if (error) {
    return /* @__PURE__ */ jsxs3("div", { style: { color: "#ef4444", fontSize: "11px", fontFamily: "monospace" }, children: [
      "Preview error: ",
      error
    ] });
  }
  return /* @__PURE__ */ jsx3("div", { style: { transform: "scale(0.75)", transformOrigin: "top left" }, children: rendered });
}
function StreamingPreview({ code }) {
  const { ctxBridge } = useClawKit();
  const [rendered, setRendered] = useState2(null);
  useEffect(() => {
    try {
      const fn = compileComponent(code, React3, ctxBridge);
      if (fn) {
        setRendered(React3.createElement(fn, {}));
      }
    } catch {
    }
  }, [code]);
  if (!rendered) return null;
  return /* @__PURE__ */ jsxs3("div", { style: { marginTop: "12px" }, children: [
    /* @__PURE__ */ jsx3("div", { style: {
      fontSize: "10px",
      fontWeight: 600,
      color: "var(--ck-text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "6px"
    }, children: "Live Preview" }),
    /* @__PURE__ */ jsx3("div", { style: {
      padding: "12px",
      borderRadius: "6px",
      background: "var(--ck-bg-secondary)",
      border: "1px solid var(--ck-border)",
      overflow: "hidden",
      transform: "scale(0.7)",
      transformOrigin: "top left"
    }, children: rendered })
  ] });
}
function TabButton({ children, active, onClick }) {
  return /* @__PURE__ */ jsx3(
    "button",
    {
      onClick,
      style: {
        padding: "8px 16px",
        fontSize: "12px",
        fontWeight: 500,
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid var(--ck-accent)" : "2px solid transparent",
        color: active ? "var(--ck-text)" : "var(--ck-text-muted)",
        cursor: "pointer",
        fontFamily: "var(--ck-font)",
        transition: "all 0.15s"
      },
      children
    }
  );
}
function CKButton({
  children,
  onClick,
  variant = "secondary",
  size = "md"
}) {
  const [hovered, setHovered] = React3.useState(false);
  const base = {
    borderRadius: size === "sm" ? "4px" : "var(--ck-radius)",
    fontSize: size === "sm" ? "11px" : "13px",
    padding: size === "sm" ? "3px 8px" : "8px 16px",
    cursor: "pointer",
    fontFamily: "var(--ck-font)",
    transition: "all 0.15s",
    border: "none",
    fontWeight: variant === "primary" ? 500 : 400
  };
  const styles = {
    primary: { ...base, background: "var(--ck-accent)", color: "var(--ck-accent-text)", opacity: hovered ? 0.9 : 1 },
    secondary: { ...base, background: hovered ? "var(--ck-bg-hover)" : "var(--ck-bg-secondary)", color: "var(--ck-text)", border: "1px solid var(--ck-border)" },
    ghost: { ...base, background: hovered ? "var(--ck-bg-hover)" : "transparent", color: "var(--ck-text-muted)" }
  };
  return /* @__PURE__ */ jsx3(
    "button",
    {
      onClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      style: styles[variant],
      children
    }
  );
}

// src/components/floating-trigger.tsx
import { useState as useState3 } from "react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function FloatingTrigger() {
  const { open, isOpen } = useClawKit();
  const [hovered, setHovered] = useState3(false);
  if (isOpen) return null;
  return /* @__PURE__ */ jsx4(
    "button",
    {
      onClick: () => open(),
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      "aria-label": "Open ClawKit",
      style: {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        background: hovered ? "var(--ck-bg-hover)" : "var(--ck-bg)",
        border: "1px solid var(--ck-border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        color: "var(--ck-text)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        transform: hovered ? "scale(1.05)" : "scale(1)",
        zIndex: 99990,
        fontFamily: "var(--ck-font)"
      },
      children: /* @__PURE__ */ jsxs4(
        "svg",
        {
          width: "20",
          height: "20",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            /* @__PURE__ */ jsx4("path", { d: "m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" }),
            /* @__PURE__ */ jsx4("path", { d: "M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" })
          ]
        }
      )
    }
  );
}

// src/components/toast.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var ICONS = {
  success: "\u2713",
  error: "\u2715",
  info: "\u2139"
};
var COLORS = {
  success: { bg: "hsl(142 71% 10%)", border: "hsl(142 71% 25%)", text: "hsl(142 71% 65%)" },
  error: { bg: "hsl(0 62% 10%)", border: "hsl(0 62% 25%)", text: "hsl(0 62% 65%)" },
  info: { bg: "var(--ck-bg-secondary)", border: "var(--ck-border)", text: "var(--ck-text-muted)" }
};
function Toast() {
  const { toasts, dismissToast } = useClawKit();
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      style: {
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99997,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none"
      },
      children: [
        toasts.map((toast) => {
          const colors = COLORS[toast.type];
          return /* @__PURE__ */ jsxs5(
            "div",
            {
              onClick: () => dismissToast(toast.id),
              style: {
                pointerEvents: "auto",
                padding: "10px 16px",
                borderRadius: "var(--ck-radius)",
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                fontSize: "13px",
                fontFamily: "var(--ck-font)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                animation: "ck-toast-in 0.3s ease-out",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap"
              },
              children: [
                /* @__PURE__ */ jsx5("span", { style: { fontWeight: 700, fontSize: "14px" }, children: ICONS[toast.type] }),
                toast.message
              ]
            },
            toast.id
          );
        }),
        /* @__PURE__ */ jsx5("style", { children: `
          @keyframes ck-toast-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        ` })
      ]
    }
  );
}

// src/components/provider.tsx
import { Fragment as Fragment2, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var ClawKitContext = createContext(null);
function useClawKit() {
  const ctx = useContext(ClawKitContext);
  if (!ctx)
    throw new Error("useClawKit must be used within a ClawKitProvider");
  return ctx;
}
var DARK_THEME = {
  "--ck-bg": "hsl(0 0% 3.9%)",
  "--ck-bg-secondary": "hsl(0 0% 9%)",
  "--ck-bg-hover": "hsl(0 0% 14.9%)",
  "--ck-border": "hsl(0 0% 14.9%)",
  "--ck-text": "hsl(0 0% 98%)",
  "--ck-text-muted": "hsl(0 0% 63.9%)",
  "--ck-accent": "hsl(0 0% 98%)",
  "--ck-accent-text": "hsl(0 0% 3.9%)",
  "--ck-radius": "0.5rem",
  "--ck-shadow": "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
  "--ck-font": '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};
var LIGHT_THEME = {
  "--ck-bg": "hsl(0 0% 100%)",
  "--ck-bg-secondary": "hsl(0 0% 96%)",
  "--ck-bg-hover": "hsl(0 0% 92%)",
  "--ck-border": "hsl(0 0% 89.8%)",
  "--ck-text": "hsl(0 0% 3.9%)",
  "--ck-text-muted": "hsl(0 0% 45.1%)",
  "--ck-accent": "hsl(0 0% 9%)",
  "--ck-accent-text": "hsl(0 0% 98%)",
  "--ck-radius": "0.5rem",
  "--ck-shadow": "0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05)",
  "--ck-font": '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};
function useThemeDetection(mode) {
  const [isDark, setIsDark] = useState4(mode === "dark");
  useEffect2(() => {
    if (mode !== "auto") {
      setIsDark(mode === "dark");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);
  return isDark ? DARK_THEME : LIGHT_THEME;
}
function autoDetectSlot(prompt, slots) {
  const lower = prompt.toLowerCase();
  let bestMatch;
  let bestScore = 0;
  for (const [id, cfg] of Object.entries(slots)) {
    let score = 0;
    if (lower.includes(id.toLowerCase())) score += 3;
    for (const word of cfg.name.toLowerCase().split(/\s+/)) {
      if (word.length > 2 && lower.includes(word)) score += 2;
    }
    if (cfg.description) {
      for (const word of cfg.description.toLowerCase().split(/\s+/)) {
        if (word.length > 3 && lower.includes(word)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = id;
    }
  }
  return bestScore >= 2 ? bestMatch : void 0;
}
function useRateLimiter(config) {
  const timestampsRef = useRef2([]);
  const check = useCallback3(() => {
    if (!config.rateLimit) return { allowed: true, remaining: Infinity };
    const { maxGenerations, windowMs } = config.rateLimit;
    const now = Date.now();
    timestampsRef.current = timestampsRef.current.filter(
      (t) => now - t < windowMs
    );
    if (timestampsRef.current.length >= maxGenerations) {
      return { allowed: false, remaining: 0 };
    }
    return {
      allowed: true,
      remaining: maxGenerations - timestampsRef.current.length
    };
  }, [config.rateLimit]);
  const record = useCallback3(() => {
    timestampsRef.current.push(Date.now());
  }, []);
  return { check, record };
}
function ClawKitProvider({
  children,
  ...config
}) {
  const store = useMemo2(
    () => config.store ?? new LocalStoreAdapter(),
    [config.store]
  );
  const [components, setComponents] = useState4([]);
  const [isOpen, setIsOpen] = useState4(false);
  const [isGenerating, setIsGenerating] = useState4(false);
  const [generationStage, setGenerationStage] = useState4("idle");
  const [selectedSlot, setSelectedSlot] = useState4(null);
  const [mode] = useState4(
    config.serverUrl ? "server" : "client"
  );
  const [lastServerMutation, setLastServerMutation] = useState4(null);
  const [toasts, setToasts] = useState4([]);
  const [mounted, setMounted] = useState4(false);
  const [streamingCode, setStreamingCode] = useState4("");
  const [highlightedSlots, setHighlightedSlots] = useState4(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState4(Infinity);
  const hasServerSupport = !!config.serverUrl;
  const compiledRef = useRef2(/* @__PURE__ */ new Map());
  const conversationHistoryRef = useRef2(
    /* @__PURE__ */ new Map()
  );
  const [conversationHistory] = useState4(conversationHistoryRef.current);
  const [dynamicStyleOverrides, setDynamicStyleOverrides] = useState4({});
  const [dynamicSlots, setDynamicSlots] = useState4({});
  const rateLimiter = useRateLimiter(config);
  const plugins = config.plugins ?? [];
  const ctxBridge = useMemo2(() => {
    const endpoint = config.endpoint ? config.endpoint.replace(/\/generate$/, "/context").replace(/\/stream$/, "/context") : "/api/clawkit/context";
    return createContextBridge({ endpoint });
  }, [config.endpoint]);
  const mergedSlots = useMemo2(() => ({
    ...config.slots ?? {},
    ...dynamicSlots
  }), [config.slots, dynamicSlots]);
  useEffect2(() => setMounted(true), []);
  useEffect2(() => {
    const shared = parseShareFromUrl();
    if (shared) {
      const fn = compileComponent(shared.code, React5, ctxBridge);
      if (fn) {
        const now = Date.now();
        const component = {
          id: `ck_shared_${now.toString(36)}`,
          slotId: shared.slotId,
          userId: config.userId,
          prompt: shared.prompt,
          code: shared.code,
          render: fn,
          createdAt: now,
          updatedAt: now,
          history: []
        };
        compiledRef.current.set(component.id, fn);
        store.save(component);
        setComponents((prev) => [...prev.filter((c) => c.slotId !== shared.slotId), component]);
        addToast("success", "Imported shared component");
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }
  }, []);
  const baseTheme = useThemeDetection(config.theme ?? "auto");
  const theme = { ...baseTheme, ...config.themeOverrides, ...dynamicStyleOverrides };
  const addToast = useCallback3(
    (type, message) => {
      const id = `t_${Date.now()}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        5e3
      );
    },
    []
  );
  const dismissToast = useCallback3((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  useEffect2(() => {
    store.load(config.userId).then((loaded) => {
      setComponents(loaded);
      for (const comp of loaded) {
        const fn = compileComponent(comp.code, React5, ctxBridge);
        if (fn) compiledRef.current.set(comp.id, fn);
      }
    });
  }, [config.userId, store]);
  useEffect2(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  useEffect2(() => {
    if (isOpen && !selectedSlot) {
      setHighlightedSlots(true);
    } else {
      setHighlightedSlots(false);
    }
  }, [isOpen, selectedSlot]);
  const open = useCallback3((slotId) => {
    setSelectedSlot(slotId ?? null);
    setIsOpen(true);
  }, []);
  const close = useCallback3(() => {
    setIsOpen(false);
    setSelectedSlot(null);
    setGenerationStage("idle");
    setStreamingCode("");
  }, []);
  const saveComponent = useCallback3(
    async (targetSlot, code, prompt, existing) => {
      const fn = compileComponent(code, React5, ctxBridge);
      if (!fn) throw new Error("Generated component failed to compile");
      const now = Date.now();
      const component = existing ? {
        ...existing,
        code,
        prompt,
        updatedAt: now,
        render: fn,
        history: [
          ...existing.history,
          {
            code: existing.code,
            prompt: existing.prompt,
            timestamp: existing.updatedAt
          }
        ]
      } : {
        id: `ck_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        slotId: targetSlot,
        userId: config.userId,
        prompt,
        code,
        render: fn,
        createdAt: now,
        updatedAt: now,
        history: []
      };
      compiledRef.current.set(component.id, fn);
      await store.save(component);
      setComponents((prev) => {
        const filtered = prev.filter((c) => c.id !== component.id);
        return [...filtered, component];
      });
      return component;
    },
    [config.userId, store]
  );
  const generateServer = useCallback3(
    async (prompt, slotId) => {
      if (!config.serverUrl) throw new Error("No serverUrl configured");
      setGenerationStage("generating");
      const res = await fetch(config.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          userId: config.userId,
          slotId,
          slotContext: mergedSlots[slotId]
        })
      });
      if (!res.ok) throw new Error(`Server mutation failed: ${res.status}`);
      const result = await res.json();
      setLastServerMutation(result);
      if (result.clientCode) {
        setGenerationStage("compiling");
        const existing = components.find((c) => c.slotId === slotId);
        await saveComponent(slotId, result.clientCode, prompt, existing);
      }
    },
    [config, components, saveComponent]
  );
  const generate = useCallback3(
    async (prompt, slotId) => {
      const resolvedSlot = slotId ?? selectedSlot ?? autoDetectSlot(prompt, mergedSlots) ?? "default";
      const existing = components.find((c) => c.slotId === resolvedSlot);
      const slotConfig = mergedSlots[resolvedSlot];
      const { allowed, remaining } = rateLimiter.check();
      if (!allowed) {
        const msg = config.rateLimit?.message ?? "Rate limit reached. Please wait before generating again.";
        addToast("error", msg);
        return;
      }
      setRateLimitRemaining(remaining - 1);
      if (config.events?.onBeforeGenerate) {
        const proceed = await config.events.onBeforeGenerate({
          prompt,
          slotId: resolvedSlot,
          userId: config.userId
        });
        if (!proceed) {
          addToast("error", "Generation blocked by content policy");
          return;
        }
      }
      config.events?.onGenerateStart?.({
        prompt,
        slotId: resolvedSlot,
        userId: config.userId
      });
      const startTime = Date.now();
      setIsGenerating(true);
      setGenerationStage("analyzing");
      setStreamingCode("");
      let refinedPrompt = prompt;
      if (config.smartPrompts) {
        refinedPrompt = refinePrompt(prompt, resolvedSlot, slotConfig, !!existing);
      }
      if (plugins.length > 0) {
        refinedPrompt = await runBeforeGenerate(plugins, {
          prompt: refinedPrompt,
          slotId: resolvedSlot,
          slotConfig,
          existingCode: existing?.code
        });
      }
      const history = conversationHistoryRef.current.get(resolvedSlot) ?? [];
      try {
        if (mode === "server") {
          await generateServer(refinedPrompt, resolvedSlot);
        } else {
          const endpoint = config.endpoint ?? "/api/clawkit/generate";
          const streamEndpoint = config.streamEndpoint;
          const request = {
            prompt: refinedPrompt,
            slotId: resolvedSlot,
            slotContext: slotConfig,
            existingCode: existing?.code,
            conversationHistory: history
          };
          let result;
          if (streamEndpoint) {
            setGenerationStage("streaming");
            result = await generateComponentStream(
              request,
              streamEndpoint,
              (_token, accumulated) => {
                setStreamingCode(accumulated);
              }
            );
          } else {
            setGenerationStage("generating");
            result = await generateComponent(request, endpoint);
          }
          let finalCode = result.code;
          if (plugins.length > 0) {
            finalCode = await runAfterGenerate(plugins, {
              code: finalCode,
              prompt: refinedPrompt,
              slotId: resolvedSlot
            });
            const validationError = await runValidate(plugins, {
              code: finalCode,
              slotId: resolvedSlot
            });
            if (validationError) {
              throw new Error(validationError);
            }
          }
          setGenerationStage("compiling");
          await saveComponent(resolvedSlot, finalCode, prompt, existing);
          const updatedHistory = [
            ...history,
            { role: "user", content: prompt },
            { role: "assistant", content: result.code }
          ];
          conversationHistoryRef.current.set(
            resolvedSlot,
            updatedHistory.slice(-6)
          );
        }
        setGenerationStage("done");
        addToast("success", "Component updated");
        rateLimiter.record();
        const durationMs = Date.now() - startTime;
        const comp = components.find((c) => c.slotId === resolvedSlot);
        config.events?.onGenerateComplete?.({
          prompt,
          slotId: resolvedSlot,
          userId: config.userId,
          durationMs,
          code: comp?.code ?? ""
        });
        config.events?.onSlotChange?.({
          slotId: resolvedSlot,
          userId: config.userId,
          action: "generate"
        });
      } catch (err) {
        setGenerationStage("error");
        const msg = err instanceof Error ? err.message : "Generation failed";
        addToast("error", msg);
        config.events?.onError?.({
          prompt,
          slotId: resolvedSlot,
          userId: config.userId,
          error: msg
        });
        console.error("[ClawKit]", err);
      } finally {
        setIsGenerating(false);
        setStreamingCode("");
      }
    },
    [
      components,
      config,
      mode,
      generateServer,
      selectedSlot,
      saveComponent,
      addToast,
      rateLimiter
    ]
  );
  const generateMultiSlot = useCallback3(
    async (prompt) => {
      if (!config.multiSlot) {
        addToast("error", "Multi-slot operations not enabled");
        return;
      }
      const slotIds = Object.keys(mergedSlots);
      if (slotIds.length === 0) return;
      setIsGenerating(true);
      setGenerationStage("analyzing");
      const startTime = Date.now();
      let completed = 0;
      try {
        for (const slotId of slotIds) {
          const slotConfig = mergedSlots[slotId];
          const existing = components.find((c) => c.slotId === slotId);
          const endpoint = config.endpoint ?? "/api/clawkit/generate";
          setGenerationStage("generating");
          addToast(
            "info",
            `Generating ${slotConfig?.name ?? slotId}... (${completed + 1}/${slotIds.length})`
          );
          const result = await generateComponent(
            {
              prompt: `${prompt}

Generate ONLY for the "${slotConfig?.name ?? slotId}" section. ${slotConfig?.description ?? ""}`,
              slotId,
              slotContext: slotConfig,
              existingCode: existing?.code
            },
            endpoint
          );
          setGenerationStage("compiling");
          await saveComponent(slotId, result.code, prompt, existing);
          completed++;
          config.events?.onSlotChange?.({
            slotId,
            userId: config.userId,
            action: "generate"
          });
        }
        setGenerationStage("done");
        addToast(
          "success",
          `All ${slotIds.length} sections updated`
        );
        const durationMs = Date.now() - startTime;
        config.events?.onGenerateComplete?.({
          prompt,
          slotId: "multi",
          userId: config.userId,
          durationMs,
          code: ""
        });
      } catch (err) {
        setGenerationStage("error");
        const msg = err instanceof Error ? err.message : "Multi-slot generation failed";
        addToast("error", `${msg} (${completed}/${slotIds.length} completed)`);
        console.error("[ClawKit]", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [components, config, saveComponent, addToast]
  );
  const applyTemplate = useCallback3(
    async (template, slotId) => {
      const existing = components.find((c) => c.slotId === slotId);
      try {
        await saveComponent(
          slotId,
          template.code,
          `Template: ${template.name}`,
          existing
        );
        addToast("success", `Applied "${template.name}" template`);
        config.events?.onSlotChange?.({
          slotId,
          userId: config.userId,
          action: "generate"
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to apply template";
        addToast("error", msg);
      }
    },
    [components, config, saveComponent, addToast]
  );
  const exportComponent = useCallback3(
    (slotId) => {
      const comp = components.find((c) => c.slotId === slotId);
      if (!comp) return null;
      return `// ClawKit Generated Component
// Slot: ${slotId}
// Prompt: "${comp.prompt}"
// Generated: ${new Date(comp.updatedAt).toISOString()}

import React from "react";

${comp.code}

export default Component;`;
    },
    [components]
  );
  const getSlotComponent = useCallback3(
    (slotId) => {
      const comp = components.find((c) => c.slotId === slotId);
      if (!comp) return null;
      return compiledRef.current.get(comp.id) ?? null;
    },
    [components]
  );
  const removeComponent = useCallback3(
    async (componentId) => {
      const comp = components.find((c) => c.id === componentId);
      compiledRef.current.delete(componentId);
      await store.delete(config.userId, componentId);
      setComponents((prev) => prev.filter((c) => c.id !== componentId));
      addToast("info", "Component removed");
      if (comp) {
        config.events?.onSlotChange?.({
          slotId: comp.slotId,
          userId: config.userId,
          action: "reset"
        });
      }
    },
    [config, components, store, addToast]
  );
  const rollback = useCallback3(
    async (componentId) => {
      const comp = components.find((c) => c.id === componentId);
      if (!comp || comp.history.length === 0) {
        addToast("info", "Nothing to undo");
        return;
      }
      const prev = comp.history[comp.history.length - 1];
      const fn = compileComponent(prev.code, React5, ctxBridge);
      if (!fn) return;
      const updated = {
        ...comp,
        code: prev.code,
        prompt: prev.prompt,
        updatedAt: Date.now(),
        history: comp.history.slice(0, -1)
      };
      compiledRef.current.set(updated.id, fn);
      await store.save(updated);
      setComponents(
        (p) => p.map((c) => c.id === updated.id ? updated : c)
      );
      addToast("success", "Reverted to previous version");
      config.events?.onSlotChange?.({
        slotId: comp.slotId,
        userId: config.userId,
        action: "rollback"
      });
    },
    [components, store, addToast, config]
  );
  const resetSlot = useCallback3(
    async (slotId) => {
      const comp = components.find((c) => c.slotId === slotId);
      if (!comp) return;
      compiledRef.current.delete(comp.id);
      await store.delete(config.userId, comp.id);
      setComponents((prev) => prev.filter((c) => c.id !== comp.id));
      conversationHistoryRef.current.delete(slotId);
      addToast("info", "Reset to default");
      config.events?.onSlotChange?.({
        slotId,
        userId: config.userId,
        action: "reset"
      });
    },
    [components, config, store, addToast]
  );
  const createSlot = useCallback3(
    (name, description) => {
      const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;
      setDynamicSlots((prev) => ({
        ...prev,
        [id]: { name, description: description ?? `Custom: ${name}` }
      }));
      return id;
    },
    []
  );
  const dynamicSlotIds = useMemo2(
    () => Object.keys(dynamicSlots),
    [dynamicSlots]
  );
  const shareComponent = useCallback3(
    async (slotId) => {
      const comp = components.find((c) => c.slotId === slotId);
      if (!comp) return null;
      const url = await generateShareUrl(
        {
          code: comp.code,
          prompt: comp.prompt,
          slotId,
          slotConfig: mergedSlots[slotId],
          themeOverrides: config.themeOverrides,
          createdAt: comp.createdAt
        },
        config.shareEndpoint
      );
      navigator.clipboard?.writeText(url).catch(() => {
      });
      addToast("success", "Share link copied to clipboard");
      return url;
    },
    [components, config, addToast]
  );
  const importSharedComponent = useCallback3(
    async (slotId, code, prompt) => {
      const existing = components.find((c) => c.slotId === slotId);
      await saveComponent(slotId, code, prompt, existing);
      addToast("success", "Component imported");
    },
    [components, saveComponent, addToast]
  );
  const applyStyleOverrides = useCallback3(
    (overrides) => {
      setDynamicStyleOverrides(overrides);
    },
    []
  );
  const value = {
    userId: config.userId,
    config,
    components,
    isOpen,
    isGenerating,
    generationStage,
    selectedSlot,
    mode,
    hasServerSupport,
    lastServerMutation,
    slots: mergedSlots,
    toasts,
    streamingCode,
    conversationHistory,
    highlightedSlots,
    templates: config.templates ?? [],
    rateLimitRemaining,
    open,
    close,
    generate,
    generateMultiSlot,
    applyTemplate,
    getSlotComponent,
    removeComponent,
    rollback,
    resetSlot,
    exportComponent,
    shareComponent,
    importSharedComponent,
    createSlot,
    dynamicSlotIds,
    dismissToast,
    setHighlightedSlots,
    applyStyleOverrides,
    styleOverrides: dynamicStyleOverrides,
    ctxBridge
  };
  return /* @__PURE__ */ jsx6(ClawKitContext.Provider, { value, children: /* @__PURE__ */ jsxs6(
    "div",
    {
      className: "clawkit-root",
      style: theme,
      children: [
        children,
        mounted && /* @__PURE__ */ jsxs6(Fragment2, { children: [
          /* @__PURE__ */ jsx6(CommandBar, {}),
          !config.hideTrigger && /* @__PURE__ */ jsx6(FloatingTrigger, {}),
          /* @__PURE__ */ jsx6(Toast, {})
        ] })
      ]
    }
  ) });
}

// src/components/slot.tsx
import React6, { Component, useEffect as useEffect3, useRef as useRef3, useState as useState5 } from "react";
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var SlotErrorBoundary = class extends Component {
  constructor() {
    super(...arguments);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error(`[ClawKit] Slot "${this.props.slotId}" error:`, error, info);
  }
  render() {
    if (this.state.error) {
      return /* @__PURE__ */ jsxs7(
        "div",
        {
          style: {
            padding: "16px",
            borderRadius: "var(--ck-radius)",
            border: "1px solid hsl(0 62% 30%)",
            background: "hsl(0 62% 8%)",
            fontFamily: "var(--ck-font)"
          },
          children: [
            /* @__PURE__ */ jsxs7("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ jsxs7("span", { style: { color: "hsl(0 62% 70%)", fontSize: "13px" }, children: [
                'Component error in "',
                this.props.slotId,
                '"'
              ] }),
              /* @__PURE__ */ jsx7(
                "button",
                {
                  onClick: () => {
                    this.setState({ error: null });
                    this.props.onEdit();
                  },
                  style: {
                    padding: "4px 12px",
                    borderRadius: "4px",
                    background: "transparent",
                    border: "1px solid hsl(0 62% 30%)",
                    color: "hsl(0 62% 70%)",
                    fontSize: "12px",
                    cursor: "pointer"
                  },
                  children: "Fix it"
                }
              )
            ] }),
            /* @__PURE__ */ jsx7("pre", { style: { fontSize: "11px", color: "hsl(0 62% 50%)", marginTop: "8px", overflow: "auto", whiteSpace: "pre-wrap" }, children: this.state.error.message })
          ]
        }
      );
    }
    return this.props.children;
  }
};
function TransitionWrapper({ children, transitionKey }) {
  const [visible, setVisible] = useState5(false);
  const prevKey = useRef3(transitionKey);
  useEffect3(() => {
    if (prevKey.current !== transitionKey) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 50);
      prevKey.current = transitionKey;
      return () => clearTimeout(t);
    } else {
      setVisible(true);
    }
  }, [transitionKey]);
  return /* @__PURE__ */ jsx7(
    "div",
    {
      style: {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
        transition: "opacity 0.3s ease, transform 0.3s ease"
      },
      children
    }
  );
}
function Slot({
  id,
  children,
  props: slotProps = {},
  editable = true,
  className,
  style,
  noTransition = false
}) {
  const { getSlotComponent, open, highlightedSlots, slots, components } = useClawKit();
  const [hovered, setHovered] = React6.useState(false);
  const UserComp = getSlotComponent(id);
  const isCustomized = !!components.find((c) => c.slotId === id);
  const slotName = slots[id]?.name ?? id;
  const comp = components.find((c) => c.slotId === id);
  const transitionKey = comp ? `${comp.id}_${comp.updatedAt}` : "default";
  const content = UserComp ? /* @__PURE__ */ jsx7(UserComp, { ...slotProps }) : children;
  const wrapped = noTransition ? content : /* @__PURE__ */ jsx7(TransitionWrapper, { transitionKey, children: content });
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      className,
      style: {
        position: "relative",
        ...style,
        ...highlightedSlots ? {
          outline: "2px dashed var(--ck-accent)",
          outlineOffset: "2px",
          borderRadius: "var(--ck-radius)",
          animation: "ck-highlight-pulse 2s ease-in-out infinite"
        } : {},
        transition: "outline 0.3s ease"
      },
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      "data-clawkit-slot": id,
      children: [
        /* @__PURE__ */ jsx7(SlotErrorBoundary, { slotId: id, onEdit: () => open(id), children: wrapped }),
        highlightedSlots && /* @__PURE__ */ jsxs7(
          "button",
          {
            onClick: () => open(id),
            style: {
              position: "absolute",
              top: "-10px",
              left: "12px",
              padding: "2px 10px",
              borderRadius: "4px",
              background: "var(--ck-accent)",
              color: "var(--ck-accent-text)",
              fontSize: "10px",
              fontWeight: 600,
              fontFamily: "var(--ck-font)",
              cursor: "pointer",
              border: "none",
              zIndex: 20,
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            },
            children: [
              isCustomized && /* @__PURE__ */ jsx7("span", { style: { width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" } }),
              slotName
            ]
          }
        ),
        editable && hovered && !highlightedSlots && /* @__PURE__ */ jsxs7(
          "button",
          {
            onClick: () => open(id),
            style: {
              position: "absolute",
              top: "8px",
              right: "8px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: "var(--ck-bg)",
              border: "1px solid var(--ck-border)",
              color: "var(--ck-text-muted)",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "var(--ck-font)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              transition: "all 0.15s",
              zIndex: 10,
              opacity: 0.9
            },
            onMouseEnter: (e) => {
              e.target.style.opacity = "1";
            },
            onMouseLeave: (e) => {
              e.target.style.opacity = "0.9";
            },
            children: [
              /* @__PURE__ */ jsxs7("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx7("path", { d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
                /* @__PURE__ */ jsx7("path", { d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" })
              ] }),
              "Edit"
            ]
          }
        ),
        highlightedSlots && /* @__PURE__ */ jsx7("style", { children: `
          @keyframes ck-highlight-pulse {
            0%, 100% { outline-color: var(--ck-accent); }
            50% { outline-color: transparent; }
          }
        ` })
      ]
    }
  );
}

// src/components/admin.tsx
import { useMemo as useMemo3 } from "react";
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function ClawKitAdmin({
  style,
  className
}) {
  const { components, slots, config } = useClawKit();
  const analytics = useMemo3(() => {
    const perSlot = {};
    const recentPrompts = [];
    for (const comp of components) {
      perSlot[comp.slotId] = (perSlot[comp.slotId] ?? 0) + 1 + comp.history.length;
      recentPrompts.push({
        prompt: comp.prompt,
        slotId: comp.slotId,
        timestamp: comp.updatedAt
      });
      for (const h of comp.history) {
        recentPrompts.push({
          prompt: h.prompt,
          slotId: comp.slotId,
          timestamp: h.timestamp
        });
      }
    }
    recentPrompts.sort((a, b) => b.timestamp - a.timestamp);
    const totalGenerations = recentPrompts.length;
    return {
      totalGenerations,
      perSlot,
      recentPrompts: recentPrompts.slice(0, 10),
      errors: 0,
      avgDurationMs: 0,
      templateUsage: recentPrompts.filter((p) => p.prompt.startsWith("Template:")).length
    };
  }, [components]);
  const slotEntries = Object.entries(slots);
  return /* @__PURE__ */ jsxs8(
    "div",
    {
      className,
      style: {
        padding: "24px",
        borderRadius: "var(--ck-radius)",
        border: "1px solid var(--ck-border)",
        background: "var(--ck-bg)",
        fontFamily: "var(--ck-font)",
        color: "var(--ck-text)",
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs8(
          "h2",
          {
            style: {
              margin: "0 0 20px",
              fontSize: "18px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            },
            children: [
              /* @__PURE__ */ jsxs8("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx8("path", { d: "M3 3v18h18" }),
                /* @__PURE__ */ jsx8("path", { d: "M7 16l4-8 4 4 4-12" })
              ] }),
              "ClawKit Analytics"
            ]
          }
        ),
        /* @__PURE__ */ jsxs8("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }, children: [
          /* @__PURE__ */ jsx8(StatCard, { label: "Total Generations", value: analytics.totalGenerations }),
          /* @__PURE__ */ jsx8(StatCard, { label: "Active Slots", value: Object.keys(analytics.perSlot).length, total: slotEntries.length }),
          /* @__PURE__ */ jsx8(StatCard, { label: "Templates Used", value: analytics.templateUsage }),
          /* @__PURE__ */ jsx8(StatCard, { label: "User", value: config.userId, isText: true })
        ] }),
        /* @__PURE__ */ jsxs8("div", { style: { marginBottom: "24px" }, children: [
          /* @__PURE__ */ jsx8("h3", { style: { margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Slot Usage" }),
          /* @__PURE__ */ jsx8("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: slotEntries.map(([id, cfg]) => {
            const count = analytics.perSlot[id] ?? 0;
            const max = Math.max(...Object.values(analytics.perSlot), 1);
            return /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
              /* @__PURE__ */ jsx8("div", { style: { width: "100px", fontSize: "12px", color: "var(--ck-text-muted)", flexShrink: 0 }, children: cfg.name }),
              /* @__PURE__ */ jsx8("div", { style: { flex: 1, height: "6px", borderRadius: "3px", background: "var(--ck-bg-secondary)", overflow: "hidden" }, children: /* @__PURE__ */ jsx8("div", { style: {
                width: `${count / max * 100}%`,
                height: "100%",
                borderRadius: "3px",
                background: count > 0 ? "var(--ck-accent)" : "transparent",
                transition: "width 0.5s ease"
              } }) }),
              /* @__PURE__ */ jsx8("span", { style: { width: "30px", fontSize: "12px", textAlign: "right", color: "var(--ck-text-muted)" }, children: count })
            ] }, id);
          }) })
        ] }),
        analytics.recentPrompts.length > 0 && /* @__PURE__ */ jsxs8("div", { children: [
          /* @__PURE__ */ jsx8("h3", { style: { margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Recent Prompts" }),
          /* @__PURE__ */ jsx8("div", { style: { display: "flex", flexDirection: "column", gap: "4px" }, children: analytics.recentPrompts.slice(0, 8).map((p, i) => /* @__PURE__ */ jsxs8("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            background: "var(--ck-bg-secondary)",
            fontSize: "12px"
          }, children: [
            /* @__PURE__ */ jsx8("span", { style: {
              padding: "1px 6px",
              borderRadius: "3px",
              fontSize: "10px",
              background: "var(--ck-bg-hover)",
              color: "var(--ck-text-muted)",
              flexShrink: 0
            }, children: slots[p.slotId]?.name ?? p.slotId }),
            /* @__PURE__ */ jsx8("span", { style: { color: "var(--ck-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: p.prompt }),
            /* @__PURE__ */ jsx8("span", { style: { fontSize: "10px", color: "var(--ck-text-muted)", marginLeft: "auto", flexShrink: 0 }, children: formatRelativeTime(p.timestamp) })
          ] }, i)) })
        ] })
      ]
    }
  );
}
function StatCard({ label, value, total, isText }) {
  return /* @__PURE__ */ jsxs8("div", { style: {
    padding: "14px",
    borderRadius: "8px",
    background: "var(--ck-bg-secondary)",
    border: "1px solid var(--ck-border)"
  }, children: [
    /* @__PURE__ */ jsx8("div", { style: { fontSize: "10px", color: "var(--ck-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }, children: label }),
    /* @__PURE__ */ jsxs8("div", { style: {
      fontSize: isText ? "13px" : "24px",
      fontWeight: isText ? 500 : 700,
      color: "var(--ck-text)",
      fontVariantNumeric: "tabular-nums"
    }, children: [
      value,
      total !== void 0 && /* @__PURE__ */ jsxs8("span", { style: { fontSize: "13px", color: "var(--ck-text-muted)", fontWeight: 400 }, children: [
        " / ",
        total
      ] })
    ] })
  ] });
}
function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)}m ago`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h ago`;
  return `${Math.floor(diff / 864e5)}d ago`;
}

// src/components/sandbox.tsx
import { useEffect as useEffect4, useRef as useRef4, useState as useState6 } from "react";
import { jsx as jsx9 } from "react/jsx-runtime";
function SandboxedComponent({
  code,
  props = {},
  theme,
  height = "auto",
  onError
}) {
  const iframeRef = useRef4(null);
  const [iframeHeight, setIframeHeight] = useState6(200);
  const themeVars = theme ? Object.entries(theme).map(([k, v]) => `${k}: ${v};`).join("\n") : "";
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://unpkg.com/react@19/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js" crossorigin></script>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  :root { ${themeVars} }
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: transparent; overflow: hidden; }
</style>
</head>
<body>
<div id="root"></div>
<script>
try {
  ${code}
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(Component, ${JSON.stringify(props)}));

  // Auto-resize
  const ro = new ResizeObserver(() => {
    const h = document.getElementById("root").scrollHeight;
    window.parent.postMessage({ type: "ck-sandbox-resize", height: h }, "*");
  });
  ro.observe(document.getElementById("root"));
} catch (e) {
  window.parent.postMessage({ type: "ck-sandbox-error", error: e.message }, "*");
  document.getElementById("root").innerHTML =
    '<div style="color:#ef4444;font-size:13px;padding:16px;font-family:monospace">Error: ' +
    e.message + '</div>';
}
</script>
</body>
</html>`;
  useEffect4(() => {
    const handler = (e) => {
      if (e.data?.type === "ck-sandbox-resize") {
        setIframeHeight(e.data.height);
      } else if (e.data?.type === "ck-sandbox-error") {
        onError?.(e.data.error);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onError]);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  useEffect4(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return /* @__PURE__ */ jsx9(
    "iframe",
    {
      ref: iframeRef,
      src: url,
      sandbox: "allow-scripts",
      style: {
        width: "100%",
        height: height === "auto" ? `${iframeHeight}px` : height,
        border: "none",
        borderRadius: "var(--ck-radius)",
        overflow: "hidden",
        transition: "height 0.2s ease"
      },
      title: "ClawKit Sandbox"
    }
  );
}

// src/store/api.ts
var APIStoreAdapter = class {
  constructor(baseUrl, headers = {}) {
    this.baseUrl = baseUrl;
    this.headers = headers;
  }
  async load(userId) {
    const res = await fetch(`${this.baseUrl}/components?userId=${userId}`, {
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to load components: ${res.status}`);
    return res.json();
  }
  async save(component) {
    await fetch(`${this.baseUrl}/components`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...this.headers },
      body: JSON.stringify(component)
    });
  }
  async delete(userId, componentId) {
    await fetch(`${this.baseUrl}/components/${componentId}?userId=${userId}`, {
      method: "DELETE",
      headers: this.headers
    });
  }
};
export {
  APIStoreAdapter,
  ClawKitAdmin,
  ClawKitProvider,
  DiffView,
  LocalStoreAdapter,
  SandboxedComponent,
  Slot,
  StyleEditor,
  createContextBridge,
  decodeSharePayload,
  encodeSharePayload,
  getSuggestions,
  parseShareFromUrl,
  refinePrompt,
  useClawKit
};
//# sourceMappingURL=index.mjs.map