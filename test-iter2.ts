/**
 * ITERATION 2: Real LLM Generation → Compile Pipeline
 * Generates components via the actual API, then compiles them locally.
 */
import { compileComponent } from "./src/lib/engine";
import { transformJSX } from "./src/lib/jsx-transform";
import React from "react";

const SLACK = "https://qualities-ray-equity-jacob.trycloudflare.com";
let passed = 0, failed = 0;
const failures: { name: string; error: string }[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try { await fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e: any) { failed++; failures.push({ name, error: e.message }); console.log(`  ❌ ${name}: ${e.message.slice(0, 200)}`); }
}

function assert(c: boolean, m: string) { if (!c) throw new Error(m); }

async function generateAndCompile(prompt: string, systemExtra = ""): Promise<string> {
  const system = `You are a React component generator for OnClaw.
Output ONLY the component code — no markdown, no backticks, no explanations.
React is available as a global — use React.useState, React.useEffect, etc.
Assign the component to \`const Component\`.
Use inline styles only. No external dependencies. No imports.
${systemExtra}`;

  const res = await fetch(`${SLACK}/api/onclaw/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      max_tokens: 2048, stream: true,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let code = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
        try { const { token } = JSON.parse(line.slice(6)); if (token) code += token; } catch {}
      }
    }
  }
  return code;
}

function extractAndCompile(raw: string, ctx?: any): boolean {
  let code = raw.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "").replace(/```\s*$/gm, "").trim();
  code = code.replace(/^import\s+.*?[;\n]/gm, "");
  code = code.replace(/^export\s+(default\s+)?/gm, "");
  
  const fn = compileComponent(code, React, ctx);
  if (!fn) {
    // Debug: try manual JSX transform to see if the issue is JSX detection
    const transformed = transformJSX(code);
    const hasLeftoverJSX = /<[a-zA-Z][^>]*>/.test(transformed);
    if (hasLeftoverJSX) {
      console.log(`    ⚠️  Leftover JSX after transform`);
      transformed.split("\n").forEach((l: string, i: number) => {
        if (/<[a-zA-Z]/.test(l) && !l.includes("'<") && !l.includes('"<')) 
          console.log(`      Line ${i}: ${l.trim().slice(0, 80)}`);
      });
    }
  }
  return fn !== null;
}

async function main() {
console.log("\n━━━ ITERATION 2: Real LLM → Compile Pipeline ━━━\n");

// Test 1: Simple UI component
await test("Generate: Simple card component", async () => {
  const raw = await generateAndCompile("A user profile card with avatar, name, and bio. Dark theme #1a1d21.");
  console.log(`    → ${raw.length} chars`);
  assert(extractAndCompile(raw), `Failed to compile:\n${raw.slice(0, 300)}`);
});

// Test 2: Stateful component with interactions
await test("Generate: Interactive todo list", async () => {
  const raw = await generateAndCompile("A todo list with add/remove/toggle complete. Dark theme. Use React.useState.");
  console.log(`    → ${raw.length} chars`);
  assert(extractAndCompile(raw), `Failed to compile:\n${raw.slice(0, 300)}`);
});

// Test 3: Data visualization
await test("Generate: Bar chart with inline SVG", async () => {
  const raw = await generateAndCompile("A bar chart showing weekly sales data using SVG. Use hardcoded data. Dark theme #0f172a.");
  console.log(`    → ${raw.length} chars`);
  assert(extractAndCompile(raw), `Failed to compile:\n${raw.slice(0, 300)}`);
});

// Test 4: Complex layout
await test("Generate: Dashboard metrics grid", async () => {
  const raw = await generateAndCompile("A 2x2 metrics grid showing Revenue, Users, Orders, Conversion Rate with icons and trend arrows. Dark #1e1e2e.");
  console.log(`    → ${raw.length} chars`);
  assert(extractAndCompile(raw), `Failed to compile:\n${raw.slice(0, 300)}`);
});

// Test 5: Component with ctx data
await test("Generate: Data-driven list with ctx.queries", async () => {
  const raw = await generateAndCompile(
    "A sortable table of items. Fetch data with ctx.queries.getItems(). Show name, status, date columns. Dark theme.",
    "The component has access to `ctx` object with `ctx.queries.getItems()` returning an array of {id, name, status, date}."
  );
  console.log(`    → ${raw.length} chars`);
  const ctx = { queries: { getItems: async () => [
    { id: 1, name: "Item A", status: "active", date: "2026-03-14" },
  ]}, actions: {} };
  assert(extractAndCompile(raw, ctx), `Failed to compile:\n${raw.slice(0, 300)}`);
});

// Test 6: Iterative refinement — generate, then modify
await test("Generate + Modify: Counter → add history", async () => {
  const v1 = await generateAndCompile("A simple counter with + and - buttons. Dark theme #1a1d21.");
  assert(extractAndCompile(v1), "V1 failed to compile");
  
  const v2Raw = await generateAndCompile(
    "Add a history section that shows the last 5 count changes as small badges",
    `Here is the CURRENT component code. Make ONLY the changes I asked for:\n\`\`\`\n${v1}\n\`\`\``
  );
  console.log(`    → V1: ${v1.length} chars, V2: ${v2Raw.length} chars`);
  assert(extractAndCompile(v2Raw), `V2 failed to compile:\n${v2Raw.slice(0, 300)}`);
});

// Test 7: Style-specific generation
await test("Generate: Glassmorphism card", async () => {
  const raw = await generateAndCompile("A glassmorphism-style notification card with blur background, rounded corners, and subtle border. Show title, message, and dismiss button.");
  console.log(`    → ${raw.length} chars`);
  assert(extractAndCompile(raw), `Failed to compile:\n${raw.slice(0, 300)}`);
});

// Test 8: Form component
await test("Generate: Login form", async () => {
  const raw = await generateAndCompile("A login form with email and password fields, a submit button, and 'forgot password' link. Dark theme. Use React.useState for form state.");
  console.log(`    → ${raw.length} chars`);
  assert(extractAndCompile(raw), `Failed to compile:\n${raw.slice(0, 300)}`);
});

console.log(`\n${"═".repeat(55)}`);
console.log(`📊 Iteration 2: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failures.length) {
  console.log("\n❌ Failures:");
  for (const f of failures) { console.log(`  • ${f.name}: ${f.error.slice(0, 250)}`); }
}
process.exit(failed > 0 ? 1 : 0);
}
main();
