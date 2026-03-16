#!/usr/bin/env node

const endpoints = [
  {
    name: 'frontend',
    url: process.env.FRONTEND_URL || 'http://127.0.0.1:3000',
    help: '프론트는 기본적으로 3000 포트를 사용합니다. 이 저장소는 Vite strictPort=true라서 3000이 이미 점유 중이면 3001로 자동 이동하지 않고 시작에 실패합니다.',
  },
  {
    name: 'backend',
    url: process.env.BACKEND_URL || 'http://127.0.0.1:5001/health',
    help: '백엔드는 `npm run backend` 또는 `npm run dev:all`로 실행하세요.',
  },
  {
    name: 'bridge',
    url: process.env.BRIDGE_URL || 'http://127.0.0.1:8787/health',
    help: '브리지는 `npm run bridge` 또는 `npm run dev:all`로 실행하세요.',
  },
];

const waitMode = process.argv.includes('--wait');
const startedAt = Date.now();
const overallTimeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 45000);
const intervalMs = Number(process.env.HEALTHCHECK_INTERVAL_MS || 1500);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkEndpoint(endpoint) {
  try {
    const response = await fetchWithTimeout(endpoint.url);
    return {
      ...endpoint,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      ...endpoint,
      ok: false,
      error: error.name === 'AbortError' ? 'timeout' : error.message,
    };
  }
}

async function probePort3001() {
  try {
    const response = await fetchWithTimeout('http://127.0.0.1:3001');
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

function printStatus(results) {
  console.log('[health] Service status');

  for (const result of results) {
    const summary = result.ok
      ? `OK (${result.status}${result.statusText ? ` ${result.statusText}` : ''})`
      : `FAIL (${result.error || `${result.status}${result.statusText ? ` ${result.statusText}` : ''}`})`;
    console.log(`- ${result.name.padEnd(8)} ${summary} -> ${result.url}`);
  }
}

async function main() {
  while (true) {
    const results = await Promise.all(endpoints.map(checkEndpoint));
    const allOk = results.every((result) => result.ok);

    if (allOk) {
      printStatus(results);
      process.exit(0);
    }

    if (!waitMode || Date.now() - startedAt >= overallTimeoutMs) {
      printStatus(results);

      const frontendOk = results.find((result) => result.name === 'frontend')?.ok;
      if (!frontendOk && (await probePort3001())) {
        console.log('- note     3001 포트에 응답이 있습니다. 이전 Vite 프로세스가 자동으로 3001로 올라갔던 흔적일 수 있습니다. 이 저장소에서는 3000만 공식 포트로 사용하세요.');
      }

      for (const result of results.filter((item) => !item.ok)) {
        console.log(`  hint/${result.name}: ${result.help}`);
      }

      process.exit(1);
    }

    await sleep(intervalMs);
  }
}

main().catch((error) => {
  console.error('[health] unexpected failure:', error);
  process.exit(1);
});
