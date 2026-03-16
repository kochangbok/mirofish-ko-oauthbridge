import fs from 'node:fs/promises'
import path from 'node:path'
import { publishReport } from '../lib/store.js'
import { isoNow } from '../lib/utils.js'
import { normalizeDashboardText } from '../lib/dashboard-text.js'
import { gatherReportArtifacts, DEFAULT_BACKEND_BASE_URL } from '../lib/mirofish.js'

function getArg(name, fallback = null) {
  const index = process.argv.indexOf(name)
  if (index >= 0) return process.argv[index + 1]
  return fallback
}

const sourceDir = getArg('--source-dir')
if (!sourceDir) {
  console.error('Usage: node scripts/publish-report.mjs --source-dir /path/to/backend/uploads/reports/report_xxxx [--request-id req_xxxx] [--backend-base-url http://127.0.0.1:5001]')
  process.exit(1)
}

const requestId = getArg('--request-id')
const backendBaseUrl = getArg('--backend-base-url', process.env.MIROFISH_BACKEND_BASE_URL || DEFAULT_BACKEND_BASE_URL)
const reportId = path.basename(sourceDir)
const metaPath = path.join(sourceDir, 'meta.json')
const fullReportPath = path.join(sourceDir, 'full_report.md')

const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'))
const markdown = await fs.readFile(fullReportPath, 'utf8')
const artifacts = await gatherReportArtifacts({
  reportId,
  simulationId: meta.simulation_id,
  baseUrl: backendBaseUrl
})

const normalized = {
  reportId,
  meta: {
    reportId,
    simulationId: meta.simulation_id,
    requestId: requestId || null,
    graphId: artifacts.graph?.graphId || meta.graph_id || null,
    title: normalizeDashboardText(meta.outline?.title || reportId),
    summary: normalizeDashboardText(meta.outline?.summary || ''),
    status: meta.status || 'completed',
    createdAt: meta.created_at || isoNow(),
    updatedAt: meta.completed_at || isoNow(),
    publishedAt: isoNow(),
    tags: ['MiroFish', 'Published Locally', 'Workbench', 'Graph'],
    sections: meta.outline?.sections || []
  },
  markdown,
  graph: artifacts.graph,
  workbench: artifacts.workbench
}

await publishReport(normalized)
console.log(`Published ${reportId}`)
