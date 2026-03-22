import { compileComponent } from "./src/lib/engine";
import { transformJSX } from "./src/lib/jsx-transform";
import * as React from "react";

const TUNNELS = {
  slack: "https://qualities-ray-equity-jacob.trycloudflare.com",
  trello: "https://protect-ban-loan-rosa.trycloudflare.com",
  mixpanel: "https://wednesday-hebrew-functions-require.trycloudflare.com",
};

const PROMPTS = [
  // Simple
  "Create a simple greeting card with a title and subtitle, dark background #1a1a2e",
  "Create a single button that counts clicks using useState",
  "A minimal loading spinner using CSS animation and inline styles",
  // Cards/Lists
  "Create a user profile card with avatar, name, email, and a follow button. Dark theme #121212",
  "Create a todo list with add/remove functionality using useState. Glassmorphism style",
  "A notification list showing 5 items with icons, timestamps, and read/unread states",
  // Tables
  "Create a data table with 5 columns (Name, Email, Role, Status, Actions) with sample data. Use map to render rows. Gradient header",
  "A sortable table component that sorts by column when clicking headers. Use useState for sort state",
  // Grids/Dashboards
  "Create a 2x2 dashboard grid with stat cards showing numbers, labels, and trend arrows. Dark theme",
  "A responsive image gallery grid with 6 placeholder items and hover overlay effects",
  // Charts (SVG)
  "Create a simple bar chart using SVG with 5 bars and labels. Use inline styles for colors",
  "A donut chart using SVG circle and stroke-dasharray. Show percentage in center",
  // Forms
  "Create a login form with email, password fields, remember me checkbox, and submit button. Glassmorphism style",
  "A multi-step form wizard with 3 steps, progress indicator, and next/back buttons using useState",
  // Modals/Overlays
  "Create a modal dialog component with overlay, title, content area, and close button. useState to toggle",
  "A dropdown menu that opens on click with 5 menu items. Use useState and conditional rendering",
  // Navigation
  "Create a sidebar navigation with 6 items, icons (use emoji), active state, and collapse toggle",
  "A responsive navbar with logo, nav links, and a hamburger menu for mobile. Dark gradient",
  // Complex
  "Create a Kanban board with 3 columns (Todo, In Progress, Done) each with 2-3 cards. Use nested maps",
  "A chat interface with message bubbles (sent/received), input field, and send button. Use useState for messages",
  "Create a pricing table with 3 tiers (Basic, Pro, Enterprise) with features list and CTA buttons",
  // ctx.queries
  "Create a dashboard that uses ctx.queries to fetch data. Show a table of results with loading state",
  // Ternaries/conditionals
  "Create a toggle switch that shows different content based on state. Use ternary operators extensively",
  // Responsive
  "A responsive card layout that shows 1 column on mobile hint, 2 on medium, 3 on large using inline styles with max-width breakpoints",
];

interface TestResult {
  id: number;
  app: string;
  prompt: string;
  success: boolean;
  failureCategory?: "llm_invalid_js" | "jsx_transform_bug" | "ts_stripping_bug" | "other";
  failureDetail?: string;
  rawOutput?: string;
  durationMs: number;
}

function extractCode(raw: string): string {
  let code = raw.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "").replace(/```\s*$/gm, "").trim();
  code = code.replace(/^import\s+.*?[;\n]/gm, "");
  code = code.replace(/^export\s+(default\s+)?/gm, "");
  // Strip TS
  code = code.replace(/^(?:export\s+)?interface\s+\w+\s*(?:<[^>]*>)?\s*\{[^}]*\}\s*;?\s*\n?/gm, "");
  code = code.replace(/^(?:export\s+)?type\s+\w+\s*(?:<[^>]*>)?\s*=\s*[^;]+;\s*\n?/gm, "");
  code = code.replace(/\s+as\s+(?:[A-Z]\w*(?:<[^>]*>)?(?:\[\])*|(?:string|number|boolean|any|unknown|never|void|null|undefined|object|bigint|symbol|const)(?:\[\])*)/g, "");
  code = code.replace(/((?:const|let|var)\s+\w+)\s*:\s*(?:[A-Za-z_][\w.]*(?:<(?:[^<>]|<[^>]*>)*>)?(?:\[\])*)\s*=/g, "$1 =");
  code = code.replace(/(\w+)\s*<((?:[A-Za-z_][\w.]*(?:\[\])?(?:\s*\|\s*(?:[A-Za-z_][\w.]*(?:\[\])?|"[^"]*"|'[^']*'|\d+|null|undefined))*)|(?:"[^"]*"(?:\s*\|\s*(?:"[^"]*"|'[^']*'|[A-Za-z_]\w*|null|undefined))*)|(?:\{[^}]*\}))>\s*\(/g, "$1(");
  
  if (!code.includes("Component")) {
    code = `const Component = (props) => {\n  return ${code}\n};`;
  }
  if (/<[A-Za-z][^>]*>/.test(code)) {
    code = transformJSX(code);
  }
  return code;
}

async function streamGenerate(endpoint: string, prompt: string): Promise<string> {
  const messages = [
    { role: "system", content: "You are a React component generator. Output ONLY component code. No markdown, no ```. Use React.useState, React.useEffect etc. Assign to `const Component`. JSX supported. Inline styles only. No imports." },
    { role: "user", content: prompt }
  ];

  const res = await fetch(`${endpoint}/api/onclaw/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: 4096, stream: true }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No body");

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
        if (token) accumulated += token;
      } catch {}
    }
  }
  return accumulated;
}

function categorizeFailure(raw: string, extracted: string, error: string): { category: TestResult["failureCategory"]; detail: string } {
  // Try JSX transform alone to see if it errors
  try {
    if (/<[A-Za-z][^>]*>/.test(extracted)) {
      transformJSX(extracted);
    }
  } catch (e: any) {
    return { category: "jsx_transform_bug", detail: `JSX transform threw: ${e.message}` };
  }

  // Check for TS remnants
  if (error.includes("Unexpected token ':'") || error.includes(": string") || error.includes(": number") || error.includes("interface ")) {
    return { category: "ts_stripping_bug", detail: error };
  }

  // Check for common LLM mistakes
  if (error.includes("Unexpected token") || error.includes("SyntaxError") || error.includes("is not defined")) {
    return { category: "llm_invalid_js", detail: error };
  }

  return { category: "other", detail: error };
}

async function runTest(id: number, app: string, endpoint: string, prompt: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const raw = await streamGenerate(endpoint, prompt);
    const code = extractCode(raw);
    
    const ctx = { queries: {}, actions: {} };
    const component = compileComponent(code, React, ctx);
    
    if (!component) {
      // Try to figure out why
      let errorMsg = "compileComponent returned null";
      try {
        new Function("React", "ctx", `${code}\nreturn Component;`)(React, ctx);
      } catch (e: any) {
        errorMsg = e.message;
      }
      const { category, detail } = categorizeFailure(raw, code, errorMsg);
      return { id, app, prompt, success: false, failureCategory: category, failureDetail: detail, rawOutput: raw.slice(0, 500), durationMs: Date.now() - start };
    }
    
    return { id, app, prompt, success: true, durationMs: Date.now() - start };
  } catch (e: any) {
    return { id, app, prompt, success: false, failureCategory: "other", failureDetail: e.message, durationMs: Date.now() - start };
  }
}

async function main() {
  console.log("Starting OnClaw generation tests...");
  const results: TestResult[] = [];
  const apps = Object.entries(TUNNELS);
  let id = 0;
  
  // Run tests across all apps, cycling through prompts
  const tasks: Promise<TestResult>[] = [];
  
  for (let i = 0; i < PROMPTS.length; i++) {
    const [appName, endpoint] = apps[i % apps.length];
    id++;
    tasks.push(runTest(id, appName, endpoint, PROMPTS[i]));
    // Run 3 at a time
    if (tasks.length >= 3) {
      const batch = await Promise.all(tasks.splice(0));
      results.push(...batch);
      for (const r of batch) {
        const status = r.success ? "✅" : `❌ [${r.failureCategory}]`;
        console.log(`#${r.id} ${r.app} ${status} (${r.durationMs}ms) - ${r.prompt.slice(0, 60)}`);
        if (!r.success) console.log(`   → ${r.failureDetail?.slice(0, 120)}`);
      }
    }
  }
  // Remaining
  if (tasks.length > 0) {
    const batch = await Promise.all(tasks);
    results.push(...batch);
    for (const r of batch) {
      const status = r.success ? "✅" : `❌ [${r.failureCategory}]`;
      console.log(`#${r.id} ${r.app} ${status} (${r.durationMs}ms) - ${r.prompt.slice(0, 60)}`);
      if (!r.success) console.log(`   → ${r.failureDetail?.slice(0, 120)}`);
    }
  }

  // Summary
  const total = results.length;
  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success);
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`RESULTS: ${successes}/${total} passed (${((successes/total)*100).toFixed(1)}%)`);
  
  const categories: Record<string, number> = {};
  for (const f of failures) {
    const cat = f.failureCategory || "unknown";
    categories[cat] = (categories[cat] || 0) + 1;
  }
  if (Object.keys(categories).length > 0) {
    console.log("\nFailure breakdown:");
    for (const [cat, count] of Object.entries(categories)) {
      console.log(`  ${cat}: ${count}`);
    }
    console.log("\nFailure details:");
    for (const f of failures) {
      console.log(`  #${f.id} [${f.failureCategory}] ${f.failureDetail?.slice(0, 150)}`);
    }
  }

  // Write results
  const output = { timestamp: new Date().toISOString(), total, successes, failureRate: ((failures.length/total)*100).toFixed(1) + "%", categories, results };
  const fs = await import("fs");
  fs.writeFileSync("/tmp/onclaw-continuous-results.json", JSON.stringify(output, null, 2));
  console.log("\nResults written to /tmp/onclaw-continuous-results.json");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
