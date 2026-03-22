
const APPS = {
  slack: 'https://qualities-ray-equity-jacob.trycloudflare.com',
  trello: 'https://protect-ban-loan-rosa.trycloudflare.com',
  mixpanel: 'https://wednesday-hebrew-functions-require.trycloudflare.com',
};

const results = { total: 0, passed: 0, failed: 0, failures: [], perApp: {} };
for (const app of Object.keys(APPS)) results.perApp[app] = { total: 0, passed: 0, failed: 0 };

function record(app, name, pass, detail = '') {
  results.total++;
  results.perApp[app].total++;
  if (pass) { results.passed++; results.perApp[app].passed++; }
  else { results.failed++; results.perApp[app].failed++; results.failures.push({ app, name, detail }); }
  console.log(`${pass ? '✅' : '❌'} [${app}] ${name}${detail && !pass ? ' — ' + detail : ''}`);
}

async function fetchJSON(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
  return r;
}

async function readSSE(url, body, { maxChunks = Infinity, abortAfter = null } = {}) {
  const controller = new AbortController();
  const r = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: controller.signal,
  });
  if (!r.ok) return { status: r.status, chunks: [], raw: await r.text() };
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let chunks = [], raw = '', count = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      raw += text;
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          chunks.push(line.slice(6));
          count++;
          if (count >= maxChunks) { controller.abort(); return { status: r.status, chunks, raw, aborted: true }; }
        }
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') return { status: r.status, chunks, raw, aborted: true };
    throw e;
  }
  return { status: r.status, chunks, raw };
}

const VALID_BODY = { messages: [{ role: 'user', content: 'Write a simple React button component' }], stream: true };

// 1. API Reliability
for (const [app, base] of Object.entries(APPS)) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${base}/api/onclaw/status`);
      const t = await r.text();
      record(app, `status #${i+1}`, r.status === 200 && t.includes('OnClaw'), `${r.status} ${t.slice(0,100)}`);
    } catch (e) { record(app, `status #${i+1}`, false, e.message); }
  }

  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetchJSON(`${base}/api/onclaw/manifest`, { method: 'POST', body: '{}' });
      record(app, `manifest #${i+1}`, [200, 404].includes(r.status), `status=${r.status}`);
    } catch (e) { record(app, `manifest #${i+1}`, false, e.message); }
  }

  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetchJSON(`${base}/api/onclaw/context`, { method: 'POST', body: '{}' });
      record(app, `context-missing #${i+1}`, r.status === 400, `status=${r.status}`);
    } catch (e) { record(app, `context-missing #${i+1}`, false, e.message); }
  }

  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetchJSON(`${base}/api/onclaw/generate`, { method: 'POST', body: '{}' });
      record(app, `generate-no-msgs #${i+1}`, r.status === 400, `status=${r.status}`);
    } catch (e) { record(app, `generate-no-msgs #${i+1}`, false, e.message); }
  }

  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetchJSON(`${base}/api/onclaw/generate`, { method: 'POST', body: JSON.stringify({ messages: [] }) });
      record(app, `generate-empty-msgs #${i+1}`, r.status === 400, `status=${r.status}`);
    } catch (e) { record(app, `generate-empty-msgs #${i+1}`, false, e.message); }
  }

  for (let i = 0; i < 3; i++) {
    try {
      const sse = await readSSE(`${base}/api/onclaw/generate`, VALID_BODY);
      const hasData = sse.chunks.length > 0;
      const hasDone = sse.chunks.includes('[DONE]');
      // Check SSE format
      let malformed = 0;
      for (const c of sse.chunks) {
        if (c === '[DONE]') continue;
        try { JSON.parse(c); } catch { malformed++; }
      }
      record(app, `generate-stream #${i+1}`, sse.status === 200 && hasData, `status=${sse.status} chunks=${sse.chunks.length} done=${hasDone} malformed=${malformed}`);
      if (malformed > 0) record(app, `sse-format #${i+1}`, false, `${malformed} malformed chunks`);
      else record(app, `sse-format #${i+1}`, true);
    } catch (e) { record(app, `generate-stream #${i+1}`, false, e.message); }
  }
}

// 2. Concurrent requests
console.log('\n--- Concurrent ---');
try {
  const promises = Object.entries(APPS).map(([app, base]) =>
    readSSE(`${base}/api/onclaw/generate`, VALID_BODY).then(r => ({ app, ...r }))
  );
  const res = await Promise.all(promises);
  const contents = res.map(r => r.chunks.filter(c => c !== '[DONE]').join(''));
  for (const r of res) record(r.app, 'concurrent', r.status === 200 && r.chunks.length > 0, `status=${r.status} chunks=${r.chunks.length}`);
  const allDiff = new Set(contents).size === contents.length;
  record('slack', 'concurrent-independent', allDiff, allDiff ? '' : 'responses were identical');
} catch (e) { record('slack', 'concurrent', false, e.message); }

// 3. Streaming reliability
console.log('\n--- Streaming ---');
for (const [app, base] of Object.entries(APPS)) {
  // Abort after 5 chunks
  try {
    const sse = await readSSE(`${base}/api/onclaw/generate`, VALID_BODY, { maxChunks: 5 });
    record(app, 'abort-after-5', sse.aborted && sse.chunks.length >= 5, `chunks=${sse.chunks.length}`);
  } catch (e) { record(app, 'abort-after-5', false, e.message); }

  // 5 sequential
  let seqOk = 0;
  for (let i = 0; i < 5; i++) {
    try {
      const sse = await readSSE(`${base}/api/onclaw/generate`, VALID_BODY);
      if (sse.status === 200 && sse.chunks.length > 0) seqOk++;
    } catch {}
  }
  record(app, 'sequential-5', seqOk === 5, `${seqOk}/5 succeeded`);

  // Short prompt
  try {
    const sse = await readSSE(`${base}/api/onclaw/generate`, { messages: [{ role: 'user', content: 'hi' }], stream: true });
    record(app, 'short-prompt', sse.status === 200 && sse.chunks.length > 0, `status=${sse.status}`);
  } catch (e) { record(app, 'short-prompt', false, e.message); }

  // Long prompt
  try {
    const longMsg = 'Write a comprehensive React component that implements a full CRUD interface with form validation, error handling, loading states, pagination, sorting, filtering, search functionality, and responsive design. Include TypeScript types, proper error boundaries, and accessibility features. Use modern React patterns like hooks, context, and suspense. ' + 'Add more detail. '.repeat(20);
    const sse = await readSSE(`${base}/api/onclaw/generate`, { messages: [{ role: 'user', content: longMsg }], stream: true });
    record(app, 'long-prompt', sse.status === 200 && sse.chunks.length > 0, `status=${sse.status} chunks=${sse.chunks.length}`);
  } catch (e) { record(app, 'long-prompt', false, e.message); }
}

// 4. Error handling
console.log('\n--- Error handling ---');
for (const [app, base] of Object.entries(APPS)) {
  // Invalid JSON
  try {
    const r = await fetch(`${base}/api/onclaw/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid json!!!' });
    record(app, 'invalid-json', r.status >= 400 && r.status < 500, `status=${r.status}`);
  } catch (e) { record(app, 'invalid-json', false, e.message); }

  // Large max_tokens
  try {
    const sse = await readSSE(`${base}/api/onclaw/generate`, { ...VALID_BODY, max_tokens: 999999 });
    record(app, 'large-max-tokens', sse.status === 200 || (sse.status >= 400 && sse.status < 500), `status=${sse.status}`);
  } catch (e) { record(app, 'large-max-tokens', false, e.message); }

  // max_tokens=1
  try {
    const sse = await readSSE(`${base}/api/onclaw/generate`, { ...VALID_BODY, max_tokens: 1 });
    record(app, 'max-tokens-1', sse.status === 200 && sse.chunks.length > 0, `status=${sse.status} chunks=${sse.chunks.length}`);
  } catch (e) { record(app, 'max-tokens-1', false, e.message); }
}

// 5. Response format validation
console.log('\n--- Format validation ---');
for (const [app, base] of Object.entries(APPS)) {
  // Non-streaming
  try {
    const r = await fetchJSON(`${base}/api/onclaw/generate`, { method: 'POST', body: JSON.stringify({ ...VALID_BODY, stream: false }) });
    if (r.status === 200) {
      const json = await r.json();
      const hasChoices = json.choices?.[0]?.message?.content;
      record(app, 'non-stream-format', !!hasChoices, hasChoices ? 'valid format' : JSON.stringify(json).slice(0, 200));
      if (hasChoices) {
        const isCode = /component|react|function|export|import|return/i.test(hasChoices);
        record(app, 'non-stream-is-code', isCode, hasChoices.slice(0, 100));
      }
    } else {
      // Maybe non-streaming not supported, that's ok
      record(app, 'non-stream-format', false, `status=${r.status}`);
    }
  } catch (e) { record(app, 'non-stream-format', false, e.message); }

  // Streaming format
  try {
    const sse = await readSSE(`${base}/api/onclaw/generate`, VALID_BODY);
    let fullContent = '';
    let validFormat = true;
    for (const c of sse.chunks) {
      if (c === '[DONE]') continue;
      try {
        const parsed = JSON.parse(c);
        // Check for token field or choices field
        if (parsed.token !== undefined) fullContent += parsed.token;
        else if (parsed.choices?.[0]?.delta?.content) fullContent += parsed.choices[0].delta.content;
        else if (parsed.choices?.[0]?.message?.content) fullContent += parsed.choices[0].message.content;
      } catch { validFormat = false; }
    }
    record(app, 'stream-format-valid', validFormat, `chunks=${sse.chunks.length}`);
    const isCode = /component|react|function|export|import|return/i.test(fullContent);
    record(app, 'stream-is-code', isCode, fullContent.slice(0, 100));
  } catch (e) { record(app, 'stream-format-valid', false, e.message); }
}

// Write results
const fs = await import('fs');
fs.writeFileSync('/tmp/onclaw-api-results.json', JSON.stringify(results, null, 2));

console.log('\n========== SUMMARY ==========');
console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed} | Rate: ${(results.passed/results.total*100).toFixed(1)}%`);
for (const [app, s] of Object.entries(results.perApp)) {
  console.log(`  ${app}: ${s.passed}/${s.total} (${(s.passed/s.total*100).toFixed(1)}%)`);
}
if (results.failures.length) {
  console.log('\nFAILURES:');
  for (const f of results.failures) console.log(`  ❌ [${f.app}] ${f.name}: ${f.detail}`);
}
