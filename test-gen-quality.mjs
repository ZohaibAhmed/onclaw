/**
 * ITERATION 4: Generation Quality Tests
 * Tests that the LLM generates code that survives the full pipeline.
 * Each test: prompt → API → raw output → extractCode → transformJSX → new Function()
 */

import { execSync } from "child_process";

const SLACK = "https://qualities-ray-equity-jacob.trycloudflare.com";
let passed = 0, failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message.slice(0, 200)}`);
  }
}

function assert(c, m) { if (!c) throw new Error(m); }

async function generateAndCompile(prompt, slotContext = null) {
  const sysPrompt = `You are a React component generator for OnClaw.
Output ONLY the component code — no markdown, no \`\`\`, no explanations.
React is available as a global — use React.useState, React.useEffect, etc.
Assign the component to \`const Component\`.
Use inline styles. No imports. No external deps.`;

  let userPrompt = prompt;
  if (slotContext) {
    userPrompt += `\n\nThis component goes in the "${slotContext}" area.`;
  }

  const res = await fetch(`${SLACK}/api/onclaw/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2048,
      stream: true,
    }),
  });

  assert(res.ok, `API ${res.status}`);

  // Consume SSE
  const reader = res.body.getReader();
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

  assert(raw.length > 20, `Too short: ${raw.length} chars`);

  // Now compile it using the engine (via tsx subprocess)
  const escaped = raw.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
  const script = `
import { compileComponent } from "/Users/zohaibahmed/clawd/clawkit/src/lib/engine";
import React from "react";
const code = \`${escaped}\`;

// Simulate extractCode
let c = code.replace(/\\\`\\\`\\\`(?:jsx?|tsx?|javascript|typescript)?\\n?/g, "").replace(/\\\`\\\`\\\`\\s*$/gm, "").trim();
c = c.replace(/^import\\s+.*?[;\\n]/gm, "");
c = c.replace(/^export\\s+(default\\s+)?/gm, "");

const fn = compileComponent(c, React);
if (fn) {
  console.log("COMPILE_OK:" + c.length);
} else {
  console.log("COMPILE_FAIL");
  console.log("CODE:" + c.slice(0, 300));
}
`;
  const tmpFile = `/tmp/onclaw-gen-test-${Date.now()}.ts`;
  const fs = await import("fs");
  fs.writeFileSync(tmpFile, script);
  
  try {
    const result = execSync(
      `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22 > /dev/null 2>&1; npx tsx ${tmpFile}`,
      { cwd: "/Users/zohaibahmed/clawd/clawkit", encoding: "utf-8", timeout: 15000, shell: "/bin/zsh" }
    );
    fs.unlinkSync(tmpFile);
    
    if (result.includes("COMPILE_OK")) {
      const len = result.match(/COMPILE_OK:(\d+)/)?.[1];
      return { ok: true, rawLen: raw.length, codeLen: parseInt(len) };
    } else {
      const codeSnippet = result.match(/CODE:(.*)/s)?.[1] || "";
      throw new Error(`Compilation failed. Generated ${raw.length} chars. Code: ${codeSnippet.slice(0, 150)}`);
    }
  } catch (e) {
    try { fs.unlinkSync(tmpFile); } catch {}
    throw e;
  }
}

// ─── Generation Quality Tests ───────────────────────────

console.log("\n🎯 ITERATION 4: Generation Quality — Full Pipeline Tests");
console.log("  (Each test: LLM prompt → API → extract → transform → compile)\n");

await test("Simple counter (vanilla)", async () => {
  const r = await generateAndCompile("Simple click counter with + and - buttons. Dark theme, #1a1d21 background.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Todo list with add/delete", async () => {
  const r = await generateAndCompile("Todo list component. Input field to add items, X button to delete. Dark theme, purple accents.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("User profile card", async () => {
  const r = await generateAndCompile("User profile card showing avatar (placeholder circle), name, email, and a Follow button. Glassmorphism style.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Analytics dashboard metrics", async () => {
  const r = await generateAndCompile(
    "Dashboard metrics row with 4 cards: Revenue ($12.5K, +12%), Users (1,234, +5%), Orders (89, -3%), Conversion (3.2%, +0.5%). Dark theme with colored accents.",
    "dashboard-metrics"
  );
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Data table with sorting", async () => {
  const r = await generateAndCompile("A data table with mock user data (name, email, role, status). Clickable column headers for sorting. Dark theme.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Chat message list (Slack-like)", async () => {
  const r = await generateAndCompile(
    "Chat message list with 5 mock messages from different users. Each message has avatar, name, timestamp, and text. Dark theme matching Slack style #1a1d21 background.",
    "message-list"
  );
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Navigation sidebar with icons", async () => {
  const r = await generateAndCompile(
    "Sidebar navigation with 6 items (Dashboard, Projects, Messages, Calendar, Settings, Help). Unicode icons, active state highlight, dark theme.",
    "channel-sidebar"
  );
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Kanban board layout", async () => {
  const r = await generateAndCompile("3-column kanban board (To Do, In Progress, Done). 2-3 cards per column. Drag handles, color-coded columns. Dark theme.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Form with validation feedback", async () => {
  const r = await generateAndCompile("Registration form with name, email, password fields. Show red border + error text for empty fields on submit. Dark theme.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

await test("Pie chart using SVG", async () => {
  const r = await generateAndCompile("Pie/donut chart using pure SVG (no libraries). 4 segments: Engineering 40%, Marketing 25%, Sales 20%, Support 15%. Legend below. Dark theme.");
  console.log(`    → ${r.rawLen} raw → ${r.codeLen} compiled`);
});

// ─── Summary ────────────────────────────────────────────

console.log(`\n${"═".repeat(55)}`);
console.log(`📊 Gen Quality: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failures.length) {
  console.log("\n❌ Failures:");
  for (const f of failures) console.log(`  • ${f.name}: ${f.error.slice(0, 200)}`);
}
console.log("");
process.exit(failed > 0 ? 1 : 0);
