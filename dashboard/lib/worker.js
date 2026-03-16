import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { getRequestIndex, getRequest, updateRequestStatus, publishReport } from './store.js'
import { readRepoBinary } from './github.js'
import { isoNow } from './utils.js'
import { normalizeDashboardText } from './dashboard-text.js'
import { gatherReportArtifacts } from './mirofish.js'

const BACKEND_BASE_URL = process.env.MIROFISH_BACKEND_BASE_URL || 'http://127.0.0.1:5001'
const DEFAULT_MAX_ROUNDS = Number.parseInt(process.env.DASHBOARD_MAX_ROUNDS || '16', 10)
const DEFAULT_PLATFORM = process.env.DASHBOARD_SIMULATION_PLATFORM || 'parallel'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiJson(pathname, init = {}) {
  const response = await fetch(`${BACKEND_BASE_URL}${pathname}`, init)
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.success) {
    const message = data?.error || data?.message || response.statusText
    throw new Error(`${pathname} failed: ${message}`)
  }
  return data.data
}

async function poll(fn, { timeoutMs = 1000 * 60 * 90, intervalMs = 5000, isDone }) {
  const started = Date.now()
  while (true) {
    const value = await fn()
    if (isDone(value)) return value
    if (Date.now() - started > timeoutMs) {
      throw new Error('Timed out while waiting for the local MiroFish backend to finish the job.')
    }
    await sleep(intervalMs)
  }
}

async function downloadRequestInputs(request) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `mirofish-${request.id}-`))
  const localFiles = []
  for (const file of request.files) {
    const raw = await readRepoBinary(file.path, { fallback: null })
    if (raw == null) throw new Error(`Input file missing in repo storage: ${file.path}`)
    const target = path.join(tmpDir, file.safeName)
    await fs.writeFile(target, raw)
    localFiles.push({ ...file, localPath: target })
  }
  return { tmpDir, localFiles }
}

async function buildOntologyAndGraph(request, localFiles) {
  const form = new FormData()
  form.set('simulation_requirement', request.prompt)
  form.set('project_name', request.projectName)
  for (const file of localFiles) {
    const buf = await fs.readFile(file.localPath)
    form.append('files', new Blob([buf], { type: file.type || 'application/octet-stream' }), file.name)
  }

  const ontology = await apiJson('/api/graph/ontology/generate', {
    method: 'POST',
    body: form
  })

  const build = await apiJson('/api/graph/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: ontology.project_id })
  })

  await poll(
    () => apiJson(`/api/graph/task/${build.task_id}`),
    {
      intervalMs: 4000,
      isDone: (task) => ['completed', 'failed'].includes(task.status)
    }
  )

  return ontology.project_id
}

async function createAndPrepareSimulation(projectId) {
  const simulation = await apiJson('/api/simulation/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, enable_twitter: true, enable_reddit: true })
  })

  const prepare = await apiJson('/api/simulation/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulation_id: simulation.simulation_id })
  })

  await poll(
    () => apiJson('/api/simulation/prepare/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulation_id: simulation.simulation_id, task_id: prepare.task_id || null })
    }),
    {
      intervalMs: 6000,
      isDone: (status) => ['ready', 'completed'].includes(status.status)
    }
  )

  return simulation.simulation_id
}

async function runSimulation(simulationId) {
  await apiJson('/api/simulation/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      simulation_id: simulationId,
      platform: DEFAULT_PLATFORM,
      max_rounds: DEFAULT_MAX_ROUNDS,
      force: true
    })
  })

  await poll(
    () => apiJson(`/api/simulation/${simulationId}/run-status`),
    {
      intervalMs: 15000,
      isDone: (status) => ['completed', 'failed', 'stopped'].includes(status.runner_status)
    }
  )
}

async function generateReport(simulationId) {
  const generated = await apiJson('/api/report/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulation_id: simulationId, force_regenerate: true })
  })

  const reportId = generated.report_id
  await poll(
    () => apiJson(`/api/report/${reportId}/progress`),
    {
      intervalMs: 10000,
      isDone: (progress) => ['completed', 'failed'].includes(progress.status)
    }
  )

  return apiJson(`/api/report/${reportId}`)
}

async function normalizeReportPayload(report, requestId) {
  const outline = report.outline || {}
  const artifacts = await gatherReportArtifacts({
    reportId: report.report_id,
    simulationId: report.simulation_id,
    baseUrl: BACKEND_BASE_URL
  })

  return {
    reportId: report.report_id,
    meta: {
      reportId: report.report_id,
      simulationId: report.simulation_id,
      requestId,
      graphId: artifacts.graph?.graphId || report.graph_id || null,
      title: normalizeDashboardText(outline.title || report.title || 'Untitled MiroFish report'),
      summary: normalizeDashboardText(outline.summary || report.summary || ''),
      status: report.status,
      createdAt: report.created_at || isoNow(),
      updatedAt: report.completed_at || isoNow(),
      publishedAt: isoNow(),
      tags: ['MiroFish', 'Queued Simulation', 'Workbench', 'Graph'],
      sections: outline.sections || []
    },
    markdown: report.markdown_content || '# Empty report\n',
    graph: artifacts.graph,
    inputs: artifacts.inputs,
    workbench: artifacts.workbench
  }
}

export async function processRequest(requestId) {
  const request = await getRequest(requestId)
  if (!request) throw new Error(`Request not found: ${requestId}`)
  if (request.status === 'completed') return request

  await updateRequestStatus(requestId, {
    status: 'processing',
    worker: { startedAt: isoNow(), backendBaseUrl: BACKEND_BASE_URL },
    progress: { stage: 'processing', message: 'The local runner claimed this job and is starting the MiroFish pipeline.' }
  })

  let tempDir = null
  try {
    const downloaded = await downloadRequestInputs(request)
    tempDir = downloaded.tmpDir

    await updateRequestStatus(requestId, {
      progress: { stage: 'ontology', message: 'Uploading files and generating ontology.' }
    })
    const projectId = await buildOntologyAndGraph(request, downloaded.localFiles)

    await updateRequestStatus(requestId, {
      progress: { stage: 'prepare', message: 'Graph complete. Preparing simulation agents and config.' },
      projectId
    })
    const simulationId = await createAndPrepareSimulation(projectId)

    await updateRequestStatus(requestId, {
      progress: { stage: 'simulation', message: `Simulation ${simulationId} is running locally.` },
      simulationId
    })
    await runSimulation(simulationId)

    await updateRequestStatus(requestId, {
      progress: { stage: 'report', message: 'Simulation completed. Generating final report.' }
    })
    const report = await generateReport(simulationId)
    const normalized = await normalizeReportPayload(report, requestId)
    await publishReport(normalized)

    return updateRequestStatus(requestId, {
      status: 'completed',
      reportId: normalized.reportId,
      progress: { stage: 'completed', message: `Report ${normalized.reportId} published to the public dashboard.` }
    })
  } catch (error) {
    await updateRequestStatus(requestId, {
      status: 'failed',
      error: error.message,
      progress: { stage: 'failed', message: error.message }
    })
    throw error
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  }
}

export async function findNextQueuedRequest() {
  const index = await getRequestIndex()
  return (index.items || []).find((item) => item.status === 'queued') || null
}
