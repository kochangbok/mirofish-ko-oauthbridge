import { REPORTS_INDEX_PATH, REQUESTS_INDEX_PATH } from './config.js'
import { readRepoFile, upsertRepoFile } from './github.js'
import { excerpt, isoNow, randomId, deriveProjectName, slugifyFilename } from './utils.js'

function sortNewest(items) {
  return [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
}

export async function getReportIndex() {
  const data = await readRepoFile(REPORTS_INDEX_PATH, {
    parseJson: true,
    fallback: { updatedAt: null, items: [] }
  })
  data.items = sortNewest(data.items || [])
  return data
}

export async function getRequestIndex() {
  const data = await readRepoFile(REQUESTS_INDEX_PATH, {
    parseJson: true,
    fallback: { updatedAt: null, items: [] }
  })
  data.items = sortNewest(data.items || [])
  return data
}

export async function getReport(reportId) {
  const [meta, markdown, graph, workbench] = await Promise.all([
    readRepoFile(`dashboard-data/reports/${reportId}/meta.json`, { parseJson: true, fallback: null }),
    readRepoFile(`dashboard-data/reports/${reportId}/full_report.md`, { parseJson: false, fallback: '' }),
    readRepoFile(`dashboard-data/reports/${reportId}/graph.json`, { parseJson: true, fallback: null }),
    readRepoFile(`dashboard-data/reports/${reportId}/workbench.json`, { parseJson: true, fallback: null })
  ])
  if (!meta) return null
  return { ...meta, markdown, graph, workbench }
}

export async function getRequest(requestId) {
  return readRepoFile(`dashboard-data/requests/${requestId}/request.json`, {
    parseJson: true,
    fallback: null
  })
}

export async function writeRequestRecord(record, message = null) {
  const requestPath = `dashboard-data/requests/${record.id}/request.json`
  await upsertRepoFile(requestPath, JSON.stringify(record, null, 2) + '\n', message || `chore(queue): update ${record.id}`)

  const index = await getRequestIndex()
  const summary = {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    status: record.status,
    projectName: record.projectName,
    promptExcerpt: excerpt(record.prompt, 180),
    fileCount: record.files.length,
    reportId: record.reportId || null,
    error: record.error || null
  }
  const nextItems = [summary, ...(index.items || []).filter((item) => item.id !== record.id)]
  const nextIndex = {
    updatedAt: isoNow(),
    items: sortNewest(nextItems)
  }
  await upsertRepoFile(REQUESTS_INDEX_PATH, JSON.stringify(nextIndex, null, 2) + '\n', `chore(queue): refresh request index (${record.id})`)
  return record
}

export async function createQueuedRequest({ prompt, files }) {
  const id = randomId('req')
  const createdAt = isoNow()
  const storedFiles = []

  for (const file of files) {
    const safeName = slugifyFilename(file.name)
    const path = `dashboard-data/requests/${id}/inputs/${safeName}`
    await upsertRepoFile(path, Buffer.from(file.buffer), `chore(queue): upload ${safeName} for ${id}`)
    storedFiles.push({
      name: file.name,
      safeName,
      path,
      size: file.size,
      type: file.type || 'application/octet-stream'
    })
  }

  const record = {
    id,
    status: 'queued',
    createdAt,
    updatedAt: createdAt,
    projectName: deriveProjectName(prompt),
    prompt,
    files: storedFiles,
    progress: {
      stage: 'queued',
      message: 'Queued on the public dashboard and waiting for the local runner.',
      updatedAt: createdAt
    },
    reportId: null,
    worker: null,
    error: null
  }

  return writeRequestRecord(record, `feat(queue): queue ${id}`)
}

export async function updateRequestStatus(requestId, patch) {
  const current = await getRequest(requestId)
  if (!current) throw new Error(`Request not found: ${requestId}`)
  const next = {
    ...current,
    ...patch,
    updatedAt: isoNow(),
    progress: patch.progress ? { ...current.progress, ...patch.progress, updatedAt: isoNow() } : current.progress
  }
  return writeRequestRecord(next, `chore(queue): ${next.status} ${requestId}`)
}

export async function publishReport({ reportId, meta, markdown, graph = null, workbench = null }) {
  const dir = `dashboard-data/reports/${reportId}`
  await upsertRepoFile(`${dir}/meta.json`, JSON.stringify(meta, null, 2) + '\n', `feat(report): publish ${reportId} meta`)
  await upsertRepoFile(`${dir}/full_report.md`, markdown, `feat(report): publish ${reportId} markdown`)
  if (graph) {
    await upsertRepoFile(`${dir}/graph.json`, JSON.stringify(graph, null, 2) + '\n', `feat(report): publish ${reportId} graph`)
  }
  if (workbench) {
    await upsertRepoFile(`${dir}/workbench.json`, JSON.stringify(workbench, null, 2) + '\n', `feat(report): publish ${reportId} workbench`)
  }

  const index = await getReportIndex()
  const summary = {
    reportId,
    title: meta.title,
    summary: meta.summary,
    status: meta.status || 'completed',
    createdAt: meta.createdAt || meta.publishedAt,
    updatedAt: meta.updatedAt || meta.publishedAt,
    publishedAt: meta.publishedAt,
    simulationId: meta.simulationId,
    requestId: meta.requestId || null,
    tags: meta.tags || [],
    graphId: graph?.graphId || meta.graphId || null,
    nodeCount: graph?.nodeCount || null,
    edgeCount: graph?.edgeCount || null,
    stepCount: workbench?.steps?.length || null
  }
  const nextItems = [summary, ...(index.items || []).filter((item) => item.reportId !== reportId)]
  const nextIndex = {
    updatedAt: isoNow(),
    items: sortNewest(nextItems)
  }
  await upsertRepoFile(REPORTS_INDEX_PATH, JSON.stringify(nextIndex, null, 2) + '\n', `feat(report): refresh index (${reportId})`)
  return summary
}
