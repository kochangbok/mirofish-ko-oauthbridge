function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderIndexPage({ defaultProviderName, supportedProviders }) {
  const options = supportedProviders
    .map((name) => `<option value="${escapeHtml(name)}"${name === defaultProviderName ? ' selected' : ''}>${escapeHtml(name)}</option>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>codex-bridge provider playground</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: Inter, system-ui, -apple-system, sans-serif; background: #0b1020; color: #e5e7eb; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 40px 20px 80px; }
    h1, h2, h3 { margin: 0 0 12px; }
    p { color: #cbd5e1; line-height: 1.6; }
    .hero, .panel { background: #111827; border: 1px solid #334155; border-radius: 18px; padding: 20px; }
    .hero { margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; }
    .stack { display: grid; gap: 20px; }
    label { display: block; font-size: 14px; margin-bottom: 8px; color: #cbd5e1; }
    input, select, textarea, button { width: 100%; box-sizing: border-box; border-radius: 12px; border: 1px solid #475569; background: #020617; color: #e5e7eb; padding: 12px 14px; font: inherit; }
    textarea { min-height: 180px; resize: vertical; }
    button { cursor: pointer; background: linear-gradient(135deg, #2563eb, #7c3aed); border: none; font-weight: 600; }
    button:hover { filter: brightness(1.08); }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    pre { white-space: pre-wrap; word-break: break-word; background: #020617; border: 1px solid #334155; border-radius: 14px; padding: 14px; overflow: auto; }
    .badges { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .badge { background: #1e293b; color: #bfdbfe; border: 1px solid #334155; border-radius: 999px; padding: 6px 10px; font-size: 12px; }
    .muted { color: #94a3b8; }
    .provider-card { border: 1px solid #334155; border-radius: 14px; padding: 14px; background: #0f172a; }
    .provider-card h3 { display: flex; justify-content: space-between; align-items: center; font-size: 16px; }
    .ok { color: #86efac; }
    .warn { color: #fcd34d; }
    .err { color: #fca5a5; }
    .row { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
    .tiny { font-size: 12px; }
    a { color: #93c5fd; }
    @media (max-width: 900px) { .grid, .row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <h1>Local provider playground</h1>
      <p>Use this page to inspect provider health and send a quick test prompt through the OpenAI-compatible bridge. This is meant for <strong>local experimentation only</strong>.</p>
      <div class="badges">
        <span class="badge">Default provider: ${escapeHtml(defaultProviderName)}</span>
        <span class="badge">Supported: ${escapeHtml(supportedProviders.join(', '))}</span>
        <span class="badge">POST /v1/chat/completions</span>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <h2>Quick test</h2>
        <p class="muted">Tip: you can also select a provider by prefixing the model name like <code>gemini:gemini-2.5-flash</code>.</p>
        <div class="row">
          <div>
            <label for="provider">Provider</label>
            <select id="provider">${options}</select>
          </div>
          <div>
            <label for="model">Model</label>
            <input id="model" value="" placeholder="Leave blank to use the provider default" />
          </div>
        </div>
        <div style="margin-top: 14px;">
          <label for="prompt">Prompt</label>
          <textarea id="prompt">Return the exact string BRIDGE_PLAYGROUND_OK and nothing else.</textarea>
        </div>
        <div style="margin-top: 14px;">
          <button id="runBtn">Send test prompt</button>
        </div>
        <p class="tiny muted" id="hint" style="margin-top: 12px;">Claude is intentionally disabled in this public build. Gemini requires local auth or another supported Gemini auth method.</p>
        <h3 style="margin-top: 18px;">Response</h3>
        <pre id="output">Waiting for input…</pre>
      </div>

      <div class="stack">
        <div class="panel">
          <h2>Provider health</h2>
          <div id="providers">Loading…</div>
        </div>
        <div class="panel">
          <h2>Usage notes</h2>
          <ul>
            <li>Default provider comes from <code>BRIDGE_PROVIDER</code>.</li>
            <li>MiroFish can also select a provider by setting <code>LLM_MODEL_NAME</code> to a provider-qualified model like <code>codex:gpt-5.1-codex-mini</code> or <code>gemini:gemini-2.5-flash</code>.</li>
            <li>Per-request provider override in this playground uses the JSON field <code>provider</code>.</li>
            <li>For details, see <code>docs/provider-interface.md</code> and <code>docs/gemini-oauth-bridge-design.md</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <script>
    const providerSelect = document.getElementById('provider');
    const modelInput = document.getElementById('model');
    const promptInput = document.getElementById('prompt');
    const output = document.getElementById('output');
    const providersWrap = document.getElementById('providers');
    const runBtn = document.getElementById('runBtn');

    async function fetchProviders() {
      const res = await fetch('/providers');
      const data = await res.json();
      providersWrap.innerHTML = data.providers.map((item) => {
        const statusClass = item.unsupported ? 'warn' : (item.cliAvailable ? 'ok' : 'err');
        const statusText = item.unsupported ? 'unsupported in public build' : (item.cliAvailable ? 'available' : 'not available');
        return '<div class="provider-card">'
          + '<h3><span>' + item.provider + '</span><span class="' + statusClass + '">' + statusText + '</span></h3>'
          + '<p class="tiny muted">default model: ' + (item.defaultModel || '-') + '</p>'
          + '<pre>' + JSON.stringify(item, null, 2) + '</pre>'
          + '</div>';
      }).join('');

      const selected = data.providers.find((item) => item.provider === providerSelect.value) || data.providers[0];
      if (selected && !modelInput.value) modelInput.value = selected.defaultModel || '';
    }

    providerSelect.addEventListener('change', async () => {
      const res = await fetch('/health?provider=' + encodeURIComponent(providerSelect.value));
      const data = await res.json();
      modelInput.value = data.defaultModel || '';
    });

    runBtn.addEventListener('click', async () => {
      output.textContent = 'Running…';
      runBtn.disabled = true;
      try {
        const payload = {
          provider: providerSelect.value,
          model: modelInput.value.trim() || undefined,
          messages: [{ role: 'user', content: promptInput.value }]
        };
        const res = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        output.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        output.textContent = String(error?.message || error);
      } finally {
        runBtn.disabled = false;
      }
    });

    fetchProviders().catch((error) => {
      providersWrap.textContent = String(error?.message || error);
    });
  </script>
</body>
</html>`;
}

module.exports = {
  renderIndexPage,
};
