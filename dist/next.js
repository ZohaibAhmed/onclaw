"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/next.ts
var next_exports = {};
__export(next_exports, {
  createClawKitHandler: () => createClawKitHandler
});
module.exports = __toCommonJS(next_exports);

// src/cli/prompts.ts
function buildRuntimeSystemPrompt(manifest) {
  return `You are a code generator for a ${manifest.framework} application using ClawKit.
You generate React components that use a provided context API to query real data.

## Project Context
- Framework: ${manifest.framework}
- ORM: ${manifest.orm || "none"}
- Database: ${manifest.database || "none"}
- Styling: ${typeof manifest.styling === "object" ? manifest.styling.framework || "tailwind" : manifest.styling || "tailwind"}
- Auth: ${manifest.auth || manifest.authSystem || "none"}

## Database Schema
${formatSchema(manifest.schema)}

## Available Context API
Generated components receive a \`ctx\` prop with these functions:

### Queries (read-only)
${formatQueries(manifest.queries)}

### Actions (mutations)
${formatActions(manifest.actions)}

## Rules
- Use ONLY \`ctx.queries.*\` and \`ctx.actions.*\` to access data \u2014 NO raw database imports
- Use ONLY React and standard browser APIs \u2014 no external imports
- Use JSX freely (it will be transpiled automatically)
- Use inline styles with CSS variables: var(--ck-bg), var(--ck-text), var(--ck-accent), var(--ck-border), var(--ck-radius)
- For charts/visualizations, use inline SVG \u2014 no chart libraries
- Use mock/sample data as fallback if a query isn't available
- Components must be self-contained \u2014 assign to \`const Component = ...\`
- Handle loading and error states gracefully
- Match the app's existing visual style: ${manifest.uiPatterns?.theme || (typeof manifest.styling === "object" ? manifest.styling.theme : "dark")} theme, ${manifest.uiPatterns?.styling || "clean minimal"}

## Available Data Fields
${formatDataFields(manifest.schema)}
`;
}
function formatSchema(schema) {
  if (!schema || Object.keys(schema).length === 0) return "No schema available.";
  return Object.entries(schema).map(([table, def]) => {
    let colLines;
    if (Array.isArray(def.columns)) {
      colLines = def.columns.map(
        (c) => `  - ${c.name}: ${c.type}${c.nullable ? " (nullable)" : ""}${c.references ? ` \u2192 ${c.references}` : ""}`
      );
    } else {
      colLines = Object.entries(def.columns).map(
        ([name, info]) => `  - ${name}: ${info.type || info}${info.nullable ? " (nullable)" : ""}${info.references ? ` \u2192 ${info.references}` : ""}`
      );
    }
    const desc = def.description ? `
  ${def.description}` : "";
    const rels = def.relations ? "\n  Relations: " + Object.entries(def.relations).map(([k, v]) => `${k} \u2192 ${typeof v === "string" ? v : v.table || JSON.stringify(v)}`).join(", ") : "";
    return `### ${table}${desc}
${colLines.join("\n")}${rels}`;
  }).join("\n\n");
}
function formatQueries(queries) {
  if (!queries) return "No queries available.";
  if (!Array.isArray(queries)) {
    return Object.entries(queries).map(([name, def]) => `- \`ctx.queries.${name}(${def.filters ? `{${def.filters.join(", ")}}` : ""})\` \u2014 ${def.description} \u2192 ${def.returns}`).join("\n");
  }
  if (queries.length === 0) return "No queries available.";
  return queries.map((q) => `- \`ctx.queries.${q.name}(${q.params || ""})\` \u2014 ${q.description} \u2192 ${q.returns}`).join("\n");
}
function formatActions(actions) {
  if (!actions) return "No write actions available (read-only mode).";
  if (!Array.isArray(actions)) {
    const entries = Object.entries(actions);
    if (entries.length === 0) return "No write actions available (read-only mode).";
    return entries.map(([name, def]) => `- \`ctx.actions.${name}(${def.params || ""})\` \u2014 ${def.description}`).join("\n");
  }
  if (actions.length === 0) return "No write actions available (read-only mode).";
  return actions.map((a) => `- \`ctx.actions.${a.name}(${a.params})\` \u2014 ${a.description}`).join("\n");
}
function formatDataFields(schema) {
  if (!schema || Object.keys(schema).length === 0) return "No schema available.";
  return Object.entries(schema).map(([table, def]) => {
    const colNames = Array.isArray(def.columns) ? def.columns.map((c) => c.name) : Object.keys(def.columns);
    return `**${table}**: ${colNames.join(", ")}`;
  }).join("\n");
}

// src/next.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var rateLimitStore = /* @__PURE__ */ new Map();
function checkRateLimit(userId, config) {
  if (!config.rateLimit) return true;
  const now = Date.now();
  const key = `rl:${userId}`;
  const timestamps = (rateLimitStore.get(key) || []).filter(
    (t) => now - t < config.rateLimit.windowMs
  );
  if (timestamps.length >= config.rateLimit.maxGenerations) return false;
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}
var cachedManifest = null;
function loadManifest(config) {
  if (cachedManifest) return cachedManifest;
  try {
    const manifestPath = config.manifestPath || path.join(process.cwd(), ".clawkit", "project.json");
    const raw = fs.readFileSync(manifestPath, "utf-8");
    cachedManifest = JSON.parse(raw);
    return cachedManifest;
  } catch {
    return null;
  }
}
async function executeContextCall(context, type, name, args) {
  const source = type === "query" ? context.queries : context.actions;
  if (!source || !(name in source)) {
    throw new Error(`Unknown ${type}: ${name}`);
  }
  const fn = source[name];
  const result = await Promise.race([
    fn(...args),
    new Promise(
      (_, reject) => setTimeout(() => reject(new Error(`${type} "${name}" timed out`)), 5e3)
    )
  ]);
  return result;
}
function createClawKitHandler(config) {
  const resolved = resolveOpenClawConfig(config);
  async function POST(req) {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === "context") {
      return handleContextCall(req, config);
    }
    if (lastSegment === "manifest") {
      return handleManifest(config);
    }
    return handleGenerate(req, config, resolved);
  }
  async function GET(req) {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === "manifest") {
      return handleManifest(config);
    }
    return new Response("ClawKit API", { status: 200 });
  }
  return { GET, POST };
}
async function handleContextCall(req, config) {
  if (config.auth) {
    try {
      const user = await config.auth(req);
      if (config.authorize) {
        const allowed = await config.authorize(user, "read");
        if (!allowed)
          return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!config.context) {
    return Response.json(
      { error: "No context API configured" },
      { status: 400 }
    );
  }
  try {
    const { type, name, args } = await req.json();
    const result = await executeContextCall(config.context, type, name, args || []);
    const json = JSON.stringify(result);
    if (json.length > 10 * 1024 * 1024) {
      return Response.json(
        { error: "Response too large. Use filters to narrow the query." },
        { status: 413 }
      );
    }
    return Response.json({ data: result });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
function handleManifest(config) {
  const manifest = loadManifest(config);
  if (!manifest) {
    return Response.json(
      { error: "No project manifest found. Run `npx clawkit init`." },
      { status: 404 }
    );
  }
  const safe = {
    framework: manifest.framework,
    orm: manifest.orm,
    database: manifest.database,
    styling: manifest.styling,
    queries: Array.isArray(manifest.queries) ? manifest.queries.map((q) => ({ name: q.name, description: q.description, params: q.params, returns: q.returns })) : manifest.queries,
    actions: Array.isArray(manifest.actions) ? manifest.actions.map((a) => ({ name: a.name, description: a.description, params: a.params })) : manifest.actions,
    slots: manifest.slots,
    uiPatterns: manifest.uiPatterns
  };
  return Response.json(safe);
}
async function handleGenerate(req, config, resolved) {
  let user;
  if (config.auth) {
    try {
      user = await config.auth(req);
      if (config.authorize) {
        const allowed = await config.authorize(user, "generate");
        if (!allowed)
          return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (user && !checkRateLimit(user.userId, config)) {
    return Response.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }
  const body = await req.json();
  let { messages, max_tokens = 4096, stream: clientRequestsStream } = body;
  const useStream = resolved.streaming || clientRequestsStream;
  const manifest = loadManifest(config);
  if (manifest) {
    const enrichedSystemPrompt = buildRuntimeSystemPrompt(manifest);
    const hasSystem = messages.some((m) => m.role === "system");
    if (hasSystem) {
      messages = messages.map(
        (m) => m.role === "system" ? { ...m, content: enrichedSystemPrompt + "\n\n" + m.content } : m
      );
    } else {
      messages = [
        { role: "system", content: enrichedSystemPrompt },
        ...messages
      ];
    }
    if (config.context) {
      const contextInfo = [
        "\n## Available at Runtime",
        "The generated component will receive `ctx` as a prop with:",
        ...Object.keys(config.context.queries).map(
          (q) => `- ctx.queries.${q}()`
        ),
        ...config.context.actions ? Object.keys(config.context.actions).map(
          (a) => `- ctx.actions.${a}()`
        ) : [],
        "",
        "To fetch data in a component, use: `const data = await ctx.queries.functionName(filters)`",
        "Wrap data fetching in React.useState + React.useEffect patterns."
      ].join("\n");
      messages = messages.map(
        (m) => m.role === "system" ? { ...m, content: m.content + contextInfo } : m
      );
    }
  }
  if (resolved.provider === "anthropic") {
    return useStream ? handleAnthropicStream(messages, max_tokens, resolved) : handleAnthropic(messages, max_tokens, resolved);
  }
  return useStream ? handleOpenAIStream(messages, max_tokens, resolved) : handleOpenAI(messages, max_tokens, resolved);
}
function resolveOpenClawConfig(config) {
  if (config.provider !== "openclaw") {
    return {
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      streaming: config.streaming
    };
  }
  let primaryModel = config.model || "";
  if (!primaryModel) {
    try {
      const configPath = config.openclawConfigPath || process.env.OPENCLAW_CONFIG_PATH || path.join(process.env.HOME || "~", ".openclaw", "openclaw.json");
      const raw = fs.readFileSync(configPath, "utf-8");
      const ocConfig = JSON.parse(raw);
      primaryModel = ocConfig?.agents?.defaults?.model?.primary || "";
    } catch {
    }
  }
  let provider = "anthropic";
  let model = config.model;
  if (primaryModel.startsWith("anthropic/")) {
    provider = "anthropic";
    const modelId = primaryModel.replace("anthropic/", "");
    model = model || mapAnthropicModel(modelId);
  } else if (primaryModel.startsWith("openai/")) {
    provider = "openai";
    model = model || primaryModel.replace("openai/", "");
  } else if (primaryModel.startsWith("google/")) {
    provider = "anthropic";
    model = model || "claude-sonnet-4-20250514";
  }
  const apiKey = provider === "anthropic" ? process.env.ANTHROPIC_API_KEY || process.env.OPENCLAW_ANTHROPIC_KEY || "" : process.env.OPENAI_API_KEY || process.env.OPENCLAW_OPENAI_KEY || "";
  if (!apiKey) {
    throw new Error(
      `ClawKit: No API key found for ${provider}. Set ${provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"} in your environment.`
    );
  }
  return { provider, apiKey, model, streaming: config.streaming };
}
function mapAnthropicModel(id) {
  const map = {
    "claude-opus-4-6": "claude-opus-4-20250514",
    "claude-sonnet-4": "claude-sonnet-4-20250514"
  };
  return map[id] || id;
}
async function handleAnthropic(messages, max_tokens, config) {
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const userMsgs = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model || "claude-sonnet-4-20250514",
      max_tokens,
      system: systemMsg,
      messages: userMsgs
    })
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  const data = await res.json();
  const content = data.content?.[0]?.text || "";
  return Response.json({ choices: [{ message: { content } }] });
}
async function handleAnthropicStream(messages, max_tokens, config) {
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const userMsgs = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model || "claude-sonnet-4-20250514",
      max_tokens,
      stream: true,
      system: systemMsg,
      messages: userMsgs
    })
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const stream = new ReadableStream({
    async pull(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (!payload || payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === "content_block_delta" && event.delta?.text) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ token: event.delta.text })}

`
                )
              );
            }
          } catch {
          }
        }
      }
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
async function handleOpenAI(messages, max_tokens, config) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o-mini",
      max_tokens,
      messages
    })
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  return Response.json(await res.json());
}
async function handleOpenAIStream(messages, max_tokens, config) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o-mini",
      max_tokens,
      stream: true,
      messages
    })
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const stream = new ReadableStream({
    async pull(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (!payload || payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload);
            const token = event.choices?.[0]?.delta?.content;
            if (token) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ token })}

`
                )
              );
            }
          } catch {
          }
        }
      }
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createClawKitHandler
});
//# sourceMappingURL=next.js.map