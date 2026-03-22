/**
 * ITERATION 4: Live Generation Quality Tests
 * Generates components via API, then compiles them through the full pipeline.
 */
import { compileComponent } from "./src/lib/engine";
import { transformJSX } from "./src/lib/jsx-transform";
import React from "react";

const SLACK = "https://qualities-ray-equity-jacob.trycloudflare.com";
let passed = 0, failed = 0;
const failures: { name: string; error: string }[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message.slice(0, 200)}`);
  }
}

async function generateAndCompile(prompt: string, slotCtx?: string) {
  const sys = `You are a React component generator for OnClaw.
Output ONLY the component code — no markdown, no \`\`\`, no explanations.
React is available as a global — use React.useState, React.useEffect, etc.
Assign the component to \`const Component\`. Use inline styles. No imports.`;

  let userPrompt = prompt;
  if (slotCtx) userPrompt += `\nThis component goes in the "${slotCtx}" area.`;

  const res = await fetch(`${SLACK}/api/onclaw/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: sys }, { role: "user", content: userPrompt }],
      max_tokens: 2048,
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
        try { const { token } = JSON.parse(line.slice(6)); if (token) raw += token; } catch {}
      }
    }
  }
  if (raw.length < 20) throw new Error(`Too short: ${raw.length} chars`);

  // extractCode pipeline
  let code = raw.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "").replace(/```\s*$/gm, "").trim();
  code = code.replace(/^import\s+.*?[;\n]/gm, "");
  code = code.replace(/^export\s+(default\s+)?/gm, "");

  // Compile
  const fn = compileComponent(code, React);
  if (!fn) {
    // Debug: check if transformJSX works
    const hasJSX = /<[A-Za-z][^>]*>/.test(code);
    if (hasJSX) {
      const transformed = transformJSX(code);
      const stillHasJSX = /<[A-Za-z][^>]*>/.test(transformed);
      throw new Error(`Compilation failed (hasJSX=${hasJSX}, afterTransform_stillJSX=${stillHasJSX}). Raw ${raw.length}. Start: ${code.slice(0, 100)}`);
    }
    throw new Error(`Compilation failed (noJSX). Raw ${raw.length}. Start: ${code.slice(0, 100)}`);
  }
  return { rawLen: raw.length, codeLen: code.length };
}

async function main() {
console.log("\n🎯 ITERATION 4: Live Generation Quality");
console.log("  (prompt → API → extract → transform → compile)\n");

await test("Counter with +/- buttons", async () => {
  const r = await generateAndCompile("Simple click counter with + and - buttons. Dark theme, #1a1d21 background.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Todo list", async () => {
  const r = await generateAndCompile("Todo list. Input to add, X to delete. Dark theme, purple accents.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Profile card", async () => {
  const r = await generateAndCompile("User profile card with avatar circle, name, email, Follow button. Glassmorphism.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Dashboard metrics", async () => {
  const r = await generateAndCompile("4 metric cards: Revenue $12.5K +12%, Users 1234 +5%, Orders 89 -3%, Conversion 3.2%.", "dashboard-metrics");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Data table", async () => {
  const r = await generateAndCompile("Data table with 5 mock users (name, email, role). Clickable headers for sorting. Dark theme.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Chat messages (Slack-like)", async () => {
  const r = await generateAndCompile("Chat message list, 5 messages from different users. Avatar, name, timestamp, text. #1a1d21 bg.", "message-list");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Sidebar nav with icons", async () => {
  const r = await generateAndCompile("Sidebar nav with 6 items (Dashboard, Projects, Messages, Calendar, Settings, Help). Unicode icons. Dark.", "channel-sidebar");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Kanban board", async () => {
  const r = await generateAndCompile("3-column kanban (To Do, In Progress, Done). 2-3 cards per column. Color-coded. Dark theme.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Form with validation", async () => {
  const r = await generateAndCompile("Registration form: name, email, password. Red border + error text on empty submit. Dark theme.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("SVG pie chart", async () => {
  const r = await generateAndCompile("Donut chart using SVG. 4 segments: Engineering 40%, Marketing 25%, Sales 20%, Support 15%. Legend. Dark.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

console.log(`\n${"═".repeat(55)}`);
console.log(`📊 Gen Quality: ${passed}/${passed + failed} passed`);
if (failures.length) {
  console.log("\n❌ Failures:");
  for (const f of failures) console.log(`  • ${f.name}: ${f.error.slice(0, 200)}`);
}
process.exit(failed > 0 ? 1 : 0);
}
main();
