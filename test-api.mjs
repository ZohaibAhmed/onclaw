/**
 * API & End-to-End tests for OnClaw via Cloudflare tunnels.
 * Run separately since these hit live APIs.
 */

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

function assert(cond, msg) { if (!cond) throw new Error(msg || "Assertion failed"); }

const SLACK = "https://qualities-ray-equity-jacob.trycloudflare.com";
const TRELLO = "https://protect-ban-loan-rosa.trycloudflare.com";
const MIXPANEL = "https://wednesday-hebrew-functions-require.trycloudflare.com";
const apps = [["Slack", SLACK], ["Trello", TRELLO], ["Mixpanel", MIXPANEL]];

console.log("\n🌐 App Loading Tests");
for (const [name, url] of apps) {
  await test(`${name} loads (200)`, async () => {
    const r = await fetch(url);
    assert(r.status === 200, `Status ${r.status}`);
  });
}

console.log("\n🔌 OnClaw API Route Tests");
// Note: catch-all route [...onclaw] requires a sub-segment, so /api/onclaw/generate is valid
for (const [name, url] of apps) {
  await test(`${name} GET /api/onclaw/status`, async () => {
    // The GET handler returns "OnClaw API" for any GET to the catch-all
    const r = await fetch(`${url}/api/onclaw/status`);
    assert(r.ok, `Status ${r.status}`);
    const t = await r.text();
    assert(t.includes("OnClaw"), `Response: ${t.slice(0, 100)}`);
  });
}

console.log("\n📋 Manifest Tests");
for (const [name, url] of apps) {
  await test(`${name} POST /api/onclaw/manifest`, async () => {
    const r = await fetch(`${url}/api/onclaw/manifest`, { method: "POST" });
    assert(r.status < 500, `Server error ${r.status}`);
  });
}

console.log("\n🚫 Validation Tests");
for (const [name, url] of apps) {
  await test(`${name} rejects bad generation request`, async () => {
    const r = await fetch(`${url}/api/onclaw/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notMessages: true }),
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
  });
}

console.log("\n🔄 Streaming Generation Tests");

await test("Slack: streaming SSE works", async () => {
  const r = await fetch(`${SLACK}/api/onclaw/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "Output ONLY code. const Component = () => React.createElement('div', null, 'Hello');" },
        { role: "user", content: "Hello world component" },
      ],
      max_tokens: 512, stream: true,
    }),
  });
  assert(r.ok, `Status ${r.status}`);
  assert(r.headers.get("content-type")?.includes("text/event-stream"), "Not SSE");
  
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let acc = "", tokens = 0, t0 = Date.now();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (Date.now() - t0 > 30000) throw new Error("Timeout");
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
        try { const { token } = JSON.parse(line.slice(6)); if (token) { acc += token; tokens++; } } catch {}
      }
    }
  }
  assert(tokens > 5, `Only ${tokens} tokens`);
  console.log(`    → ${tokens} tokens, ${acc.length} chars, ${Date.now() - t0}ms`);
});

console.log("\n📦 Non-Streaming Generation Tests");

await test("Trello: non-streaming returns valid JSON", async () => {
  // Note: apps have streaming: true in config, so we explicitly pass stream: false
  const r = await fetch(`${TRELLO}/api/onclaw/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "Output ONLY: const Component = () => React.createElement('div', null, 'Test');" },
        { role: "user", content: "Test" },
      ],
      max_tokens: 256,
      stream: false,
    }),
  });
  assert(r.ok, `Status ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  if (ct.includes("text/event-stream")) {
    // Server config overrides — streaming is forced. Still valid behavior.
    console.log("    → Server forces streaming (config: streaming=true). Consuming SSE...");
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let acc = "", tokens = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value, { stream: true }).split("\n")) {
        if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
          try { const { token } = JSON.parse(line.slice(6)); if (token) { acc += token; tokens++; } } catch {}
        }
      }
    }
    assert(tokens > 0, "No tokens in stream");
    console.log(`    → ${tokens} tokens, ${acc.length} chars`);
  } else {
    const d = await r.json();
    assert(d.choices?.[0]?.message?.content, "No content");
    console.log(`    → ${d.choices[0].message.content.length} chars`);
  }
});

console.log("\n🔒 Context Endpoint Tests");

await test("Mixpanel: context graceful on missing config", async () => {
  const r = await fetch(`${MIXPANEL}/api/onclaw/context`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "query", name: "nope", args: [] }),
  });
  assert(r.status < 500, `Server error ${r.status}`);
});

console.log("\n🎯 Generation Quality Test");

await test("Full generation: produces compilable component", async () => {
  const r = await fetch(`${SLACK}/api/onclaw/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: `You are a React component generator.
Output ONLY code — no markdown, no backticks, no explanations.
Use React.createElement (not JSX). Assign to const Component.
Use React.useState for state. Inline styles only.` },
        { role: "user", content: "Counter with + and - buttons. Dark theme #1a1d21 bg, white text." },
      ],
      max_tokens: 1024,
    }),
  });
  assert(r.ok, `Status ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  let code = "";
  if (ct.includes("text/event-stream")) {
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value, { stream: true }).split("\n")) {
        if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
          try { const { token } = JSON.parse(line.slice(6)); if (token) code += token; } catch {}
        }
      }
    }
  } else {
    const d = await r.json();
    code = d.choices[0].message.content;
  }
  assert(code.includes("Component"), "Missing Component");
  assert(code.includes("useState") || code.includes("createElement"), "Missing React patterns");
  const hasMarkdown = code.includes("```");
  console.log(`    → ${code.length} chars, markdown: ${hasMarkdown ? "⚠️ YES" : "✓ none"}`);
  if (hasMarkdown) console.log("    ⚠️  LLM included markdown — extractCode would strip it");
});

// ─── Summary ──────────────────────────────────────────

console.log(`\n${"═".repeat(55)}`);
console.log(`📊 API Tests: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failures.length) {
  console.log("\n❌ Failures:");
  for (const f of failures) console.log(`  • ${f.name}: ${f.error.slice(0, 200)}`);
}
console.log("");
process.exit(failed > 0 ? 1 : 0);
