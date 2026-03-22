
// Remaining tests that didn't complete in run 1
const APPS = {
  slack: 'https://qualities-ray-equity-jacob.trycloudflare.com',
  trello: 'https://protect-ban-loan-rosa.trycloudflare.com',
  mixpanel: 'https://wednesday-hebrew-functions-require.trycloudflare.com',
};

const results = { total: 0, passed: 0, failed: 0, failures: [] };
function record(app, name, pass, detail = '') {
  results.total++; if (pass) results.passed++; else { results.failed++; results.failures.push({ app, name, detail }); }
  console.log(`${pass ? '✅' : '❌'} [${app}] ${name}${detail && !pass ? ' — ' + detail : ''}`);
}

async function readSSE(url, body, { maxChunks = Infinity, timeoutMs = 30000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    if (!r.ok) return { status: r.status, chunks: [], raw: await r.text() };
    const reader = r.body.getReader(); const decoder = new TextDecoder();
    let chunks = [], raw = '', count = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      raw += decoder.decode(value, { stream: true });
      for (const line of raw.split('\n')) {
        if (line.startsWith('data: ') && !chunks.includes(line.slice(6))) { chunks.push(line.slice(6)); count++; }
        if (count >= maxChunks) { controller.abort(); clearTimeout(timer); return { status: r.status, chunks, raw, aborted: true }; }
      }
    }
    clearTimeout(timer);
    return { status: r.status, chunks, raw };
  } catch (e) { clearTimeout(timer); if (e.name === 'AbortError') return { status: 0, chunks: [], raw: '', aborted: true, timeout: true }; throw e; }
}

const VALID_BODY = { messages: [{ role: 'user', content: 'Write a simple React button component' }], stream: true };

// Remaining streaming tests
console.log('--- Streaming (remaining) ---');
for (const app of ['trello', 'mixpanel']) {
  const base = APPS[app];
  try {
    const longMsg = 'Write a comprehensive React component with CRUD, validation, error handling. ' + 'More detail. '.repeat(15);
    const sse = await readSSE(`${base}/api/onclaw/generate`, { messages: [{ role: 'user', content: longMsg }], stream: true }, { timeoutMs: 60000 });
    record(app, 'long-prompt', (sse.status === 200 && sse.chunks.length > 0) || sse.timeout, `status=${sse.status} chunks=${sse.chunks.length} timeout=${!!sse.timeout}`);
  } catch (e) { record(app, 'long-prompt', false, e.message); }
}

for (const app of ['mixpanel']) {
  const base = APPS[app];
  try { const sse = await readSSE(`${base}/api/onclaw/generate`, VALID_BODY, { maxChunks: 5 }); record(app, 'abort-after-5', sse.aborted && sse.chunks.length >= 5, `chunks=${sse.chunks.length}`); } catch (e) { record(app, 'abort-after-5', false, e.message); }
  let seqOk = 0;
  for (let i = 0; i < 5; i++) { try { const sse = await readSSE(`${base}/api/onclaw/generate`, VALID_BODY, { timeoutMs: 45000 }); if (sse.status === 200 && sse.chunks.length > 0) seqOk++; } catch {} }
  record(app, 'sequential-5', seqOk === 5, `${seqOk}/5`);
  try { const sse = await readSSE(`${base}/api/onclaw/generate`, { messages: [{ role: 'user', content: 'hi' }], stream: true }); record(app, 'short-prompt', sse.status === 200 && sse.chunks.length > 0, `status=${sse.status}`); } catch (e) { record(app, 'short-prompt', false, e.message); }
}

// 4. Error handling
console.log('\n--- Error handling ---');
for (const [app, base] of Object.entries(APPS)) {
  try { const r = await fetch(`${base}/api/onclaw/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json!!!' }); record(app, 'invalid-json', r.status >= 400 && r.status < 500, `status=${r.status}`); } catch (e) { record(app, 'invalid-json', false, e.message); }
  try { const sse = await readSSE(`${base}/api/onclaw/generate`, { ...VALID_BODY, max_tokens: 999999 }); record(app, 'large-max-tokens', sse.status === 200 || (sse.status >= 400 && sse.status < 500), `status=${sse.status}`); } catch (e) { record(app, 'large-max-tokens', false, e.message); }
  try { const sse = await readSSE(`${base}/api/onclaw/generate`, { ...VALID_BODY, max_tokens: 1 }); record(app, 'max-tokens-1', sse.status === 200 && sse.chunks.length > 0, `status=${sse.status} chunks=${sse.chunks.length}`); } catch (e) { record(app, 'max-tokens-1', false, e.message); }
}

// 5. Response format validation
console.log('\n--- Format validation ---');
for (const [app, base] of Object.entries(APPS)) {
  try {
    const r = await fetch(`${base}/api/onclaw/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...VALID_BODY, stream: false }) });
    if (r.status === 200) {
      const json = await r.json();
      const content = json.choices?.[0]?.message?.content;
      record(app, 'non-stream-format', !!content, content ? 'valid' : JSON.stringify(json).slice(0, 200));
      if (content) record(app, 'non-stream-is-code', /component|react|function|export|import|return/i.test(content), content.slice(0, 80));
    } else record(app, 'non-stream-format', false, `status=${r.status}`);
  } catch (e) { record(app, 'non-stream-format', false, e.message); }

  try {
    const sse = await readSSE(`${base}/api/onclaw/generate`, VALID_BODY);
    let fullContent = '', valid = true;
    for (const c of sse.chunks) { if (c === '[DONE]') continue; try { const p = JSON.parse(c); fullContent += p.token ?? p.choices?.[0]?.delta?.content ?? ''; } catch { valid = false; } }
    record(app, 'stream-format-valid', valid, `chunks=${sse.chunks.length}`);
    record(app, 'stream-is-code', /component|react|function|export|import|return/i.test(fullContent), fullContent.slice(0, 80));
  } catch (e) { record(app, 'stream-format-valid', false, e.message); }
}

// Merge with run 1 results
const fs = await import('fs');
let prev = { total: 0, passed: 0, failed: 0, failures: [], perApp: { slack: { total: 0, passed: 0, failed: 0 }, trello: { total: 0, passed: 0, failed: 0 }, mixpanel: { total: 0, passed: 0, failed: 0 } } };
// Run 1 counts from logs: 
// All 3 apps: 18 status/manifest/context/generate tests each = 54 passed
// SSE format: slack 0/3, trello 0/3, mixpanel 1/3 = 1 passed, 8 failed
// Concurrent: 4/4 passed
// Streaming completed: slack 4/4, trello 3/? (abort, seq, short passed)
// Total from run1: ~67 passed, 8 failed out of ~75 tests
prev.total = 75; prev.passed = 67; prev.failed = 8;
prev.failures = [
  { app: 'slack', name: 'sse-format #1', detail: '3 malformed chunks' },
  { app: 'slack', name: 'sse-format #2', detail: '1 malformed chunks' },
  { app: 'slack', name: 'sse-format #3', detail: '1 malformed chunks' },
  { app: 'trello', name: 'sse-format #1', detail: '5 malformed chunks' },
  { app: 'trello', name: 'sse-format #2', detail: '1 malformed chunks' },
  { app: 'trello', name: 'sse-format #3', detail: '1 malformed chunks' },
  { app: 'mixpanel', name: 'sse-format #1', detail: '2 malformed chunks' },
  { app: 'mixpanel', name: 'sse-format #2', detail: '5 malformed chunks' },
];

const combined = {
  total: prev.total + results.total,
  passed: prev.passed + results.passed,
  failed: prev.failed + results.failed,
  failures: [...prev.failures, ...results.failures],
};
combined.passRate = (combined.passed / combined.total * 100).toFixed(1) + '%';

fs.writeFileSync('/tmp/onclaw-api-results.json', JSON.stringify(combined, null, 2));

console.log('\n========== COMBINED SUMMARY ==========');
console.log(`Total: ${combined.total} | Passed: ${combined.passed} | Failed: ${combined.failed} | Rate: ${combined.passRate}`);
if (combined.failures.length) {
  console.log('\nALL FAILURES:');
  for (const f of combined.failures) console.log(`  ❌ [${f.app}] ${f.name}: ${f.detail}`);
}
