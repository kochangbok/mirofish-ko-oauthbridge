import { countBy, excerpt } from './utils.js'
import { normalizeConfigReasoning, normalizeDashboardText } from './dashboard-text.js'

export const DEFAULT_BACKEND_BASE_URL = process.env.MIROFISH_BACKEND_BASE_URL || 'http://127.0.0.1:5001'

async function parseJsonResponse(response, pathname) {
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    const reason = payload?.error || payload?.message || response.statusText || 'Unknown error'
    throw new Error(`MiroFish API ${pathname} failed: ${reason}`)
  }
  return payload.data
}

export async function mirofishJson(pathname, { baseUrl = DEFAULT_BACKEND_BASE_URL } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  return parseJsonResponse(response, pathname)
}

export async function tryMirofishJson(pathname, { baseUrl = DEFAULT_BACKEND_BASE_URL, fallback = null } = {}) {
  try {
    return await mirofishJson(pathname, { baseUrl })
  } catch {
    return fallback
  }
}

function topLabel(node) {
  const labels = Array.isArray(node?.labels) ? node.labels : []
  return labels.find((label) => label && label !== 'Entity') || labels[0] || '알 수 없음'
}

function countNodeLabels(nodes) {
  return countBy(nodes, (node) => topLabel(node))
}

function countRelations(edges) {
  return countBy(edges, (edge) => edge?.fact_type || edge?.name || 'RELATED_TO')
}

function buildGraphArtifact({ project, graph }) {
  const nodes = graph?.nodes || []
  const edges = graph?.edges || []
  const ontology = project?.ontology || {}

  return {
    graphId: graph?.graph_id || project?.graph_id || null,
    nodeCount: graph?.node_count || nodes.length,
    edgeCount: graph?.edge_count || edges.length,
    schemaTypeCount: (ontology?.entity_types?.length || 0) + (ontology?.edge_types?.length || 0),
    analysisSummary: normalizeDashboardText(project?.analysis_summary || ''),
    uploadedFiles: project?.files || [],
    totalTextLength: project?.total_text_length || 0,
    ontology: {
      entityTypes: ontology?.entity_types || [],
      relationTypes: ontology?.edge_types || []
    },
    labelCounts: countNodeLabels(nodes),
    relationCounts: countRelations(edges),
    nodes: nodes.map((node) => ({
      ...node,
      summary: normalizeDashboardText(node?.summary || '')
    })),
    edges: edges.map((edge) => ({
      ...edge,
      fact: normalizeDashboardText(edge?.fact || '')
    })),
    generatedAt: project?.updated_at || project?.created_at || null
  }
}

function buildStepStatus(rawStatus, fallback = 'completed') {
  const status = `${rawStatus || fallback}`.toLowerCase()
  if (['completed', 'ready', 'success', 'done', 'graph_completed'].includes(status)) return 'completed'
  if (['failed', 'error', 'stopped'].includes(status)) return 'failed'
  if (['processing', 'running', 'generating', 'planning', 'preparing', 'graph_building', 'ontology_generated'].includes(status)) return 'processing'
  return 'pending'
}

function buildWorkbenchArtifact({ project, simulation, config, run, report, progress, sections, consoleLog, agentLog, graph }) {
  const ontology = project?.ontology || {}
  const reportOutline = report?.outline || {}
  const uploadedFiles = project?.files || []
  const graphNodes = graph?.node_count || graph?.nodes?.length || 0
  const graphEdges = graph?.edge_count || graph?.edges?.length || 0
  const entityTypes = simulation?.entity_types || config?.entity_types || []
  const agentConfigs = config?.agent_configs || []
  const recentActions = run?.recent_actions || []
  const normalizedConfig = config
    ? { ...config, generation_reasoning: normalizeConfigReasoning(config?.generation_reasoning || '') }
    : null

  const steps = [
    {
      id: 'ontology',
      number: '01',
      title: '온톨로지 생성',
      api: 'POST /api/graph/ontology/generate',
      description: 'LLM이 업로드한 문서와 시뮬레이션 요구를 분석해 엔터티/관계 스키마를 자동 생성합니다.',
      status: buildStepStatus(ontology?.entity_types?.length ? 'completed' : project?.status, 'completed'),
      summary: `${uploadedFiles.length}개 파일 · 총 ${project?.total_text_length || 0}자 · 엔터티 유형 ${ontology?.entity_types?.length || 0}개`,
      metrics: [
        { label: '업로드 파일', value: uploadedFiles.length },
        { label: '총 텍스트 길이', value: project?.total_text_length || 0 },
        { label: '엔터티 유형', value: ontology?.entity_types?.length || 0 },
        { label: '관계 유형', value: ontology?.edge_types?.length || 0 }
      ],
      tagGroups: [
        { label: '생성된 엔터티 유형', tags: (ontology?.entity_types || []).map((item) => item.name) },
        { label: '생성된 관계 유형', tags: (ontology?.edge_types || []).map((item) => item.name) }
      ],
      bullets: uploadedFiles.map((file) => normalizeDashboardText(`${file.filename} · ${file.size}바이트`)),
      note: normalizeDashboardText(project?.analysis_summary || '')
    },
    {
      id: 'graph',
      number: '02',
      title: '그래프 구축',
      api: 'POST /api/graph/build',
      description: '문서를 분할한 뒤 Zep Graph에 엔터티·관계·시계열 메모리를 적재합니다.',
      status: buildStepStatus(project?.status, 'completed'),
      summary: `그래프 ${project?.graph_id || graph?.graph_id || '—'} · 노드 ${graphNodes}개 · 엣지 ${graphEdges}개`,
      metrics: [
        { label: '그래프 ID', value: project?.graph_id || graph?.graph_id || '—' },
        { label: '엔터티 노드', value: graphNodes },
        { label: '관계 엣지', value: graphEdges },
        { label: '스키마 유형', value: (ontology?.entity_types?.length || 0) + (ontology?.edge_types?.length || 0) }
      ],
      tagGroups: [
        { label: '상위 노드 라벨', tags: countNodeLabels(graph?.nodes || []).slice(0, 8).map((item) => `${item.label} · ${item.count}`) },
        { label: '상위 관계 유형', tags: countRelations(graph?.edges || []).slice(0, 8).map((item) => `${item.label} · ${item.count}`) }
      ]
    },
    {
      id: 'prepare',
      number: '03',
      title: '시뮬레이션 환경 구성',
      api: 'POST /api/simulation/prepare',
      description: '그래프에서 필터링한 엔터티로 에이전트 프로필과 시간/행동 구성을 생성합니다.',
      status: buildStepStatus(simulation?.status, config ? 'completed' : 'processing'),
      summary: `시뮬레이션 ${simulation?.simulation_id || report?.simulation_id || '—'} · 에이전트 ${simulation?.entities_count || agentConfigs.length || 0}명 · 프로필 ${simulation?.profiles_count || 0}개`,
      metrics: [
        { label: '시뮬레이션 ID', value: simulation?.simulation_id || report?.simulation_id || '—' },
        { label: '필터링 엔터티', value: simulation?.entities_count || agentConfigs.length || 0 },
        { label: '생성 프로필', value: simulation?.profiles_count || 0 },
        { label: '총 시뮬레이션 시간', value: config?.time_config?.total_simulation_hours || '—' }
      ],
      tagGroups: [
        { label: '엔터티 유형', tags: entityTypes },
        { label: '활성 에이전트 예시', tags: agentConfigs.slice(0, 12).map((agent) => `${agent.entity_name} · ${agent.entity_type}`) }
      ],
      note: normalizeConfigReasoning(simulation?.config_reasoning || config?.generation_reasoning || '')
    },
    {
      id: 'run',
      number: '04',
      title: '시뮬레이션 실행',
      api: 'POST /api/simulation/start',
      description: '트위터/레딧 병렬 시뮬레이션을 실행하고 라운드 단위 상태를 기록합니다.',
      status: buildStepStatus(run?.runner_status || simulation?.status, run ? 'completed' : 'processing'),
      summary: `${run?.runner_status || simulation?.status || '대기'} · 라운드 ${run?.current_round || 0}/${run?.total_rounds || 0} · 최근 액션 ${recentActions.length}개`,
      metrics: [
        { label: '실행 상태', value: run?.runner_status || '—' },
        { label: '현재 라운드', value: run?.current_round || 0 },
        { label: '총 라운드', value: run?.total_rounds || 0 },
        { label: '진행률', value: `${Math.round(run?.progress_percent || 0)}%` }
      ],
      bullets: [
        `트위터: ${run?.twitter_completed ? '완료' : run?.twitter_running ? '실행 중' : run?.twitter_status || '대기'}`,
        `레딧: ${run?.reddit_completed ? '완료' : run?.reddit_running ? '실행 중' : run?.reddit_status || '대기'}`,
        `시작: ${run?.started_at || '—'}`,
        `완료: ${run?.completed_at || '—'}`
      ].map((item) => normalizeDashboardText(item)),
      logLines: recentActions.slice(0, 10).map((action) => normalizeDashboardText(`${action.platform || '플랫폼'} · 라운드 ${action.round_number || '?'} · ${excerpt(action.action_type || action.action || JSON.stringify(action), 140)}`))
    },
    {
      id: 'report',
      number: '05',
      title: '예측 보고서 생성',
      api: 'POST /api/report/generate',
      description: '리포트 에이전트가 개요를 계획하고 섹션별 도구 호출을 거쳐 최종 보고서를 조립합니다.',
      status: buildStepStatus(report?.status || progress?.status, report ? 'completed' : 'processing'),
      summary: `리포트 ${report?.report_id || '—'} · 섹션 ${sections?.length || reportOutline?.sections?.length || 0}개 · 콘솔 로그 ${consoleLog?.length || 0}줄`,
      metrics: [
        { label: '리포트 ID', value: report?.report_id || '—' },
        { label: '상태', value: report?.status || progress?.status || '—' },
        { label: '섹션 수', value: sections?.length || reportOutline?.sections?.length || 0 },
        { label: '에이전트 로그', value: agentLog?.length || 0 }
      ],
      bullets: (reportOutline?.sections || []).map((section, index) => normalizeDashboardText(`${index + 1}. ${section.title}`)),
      logLines: [...(consoleLog || []).slice(0, 20)].map((line) => normalizeDashboardText(line))
    }
  ]

  return {
    project: {
      projectId: project?.project_id,
      status: project?.status,
      createdAt: project?.created_at,
      updatedAt: project?.updated_at,
      graphId: project?.graph_id,
      uploadedFiles,
      totalTextLength: project?.total_text_length || 0
    },
    simulation: {
      simulationId: simulation?.simulation_id || report?.simulation_id,
      status: simulation?.status,
      graphId: simulation?.graph_id || report?.graph_id || project?.graph_id,
      entitiesCount: simulation?.entities_count || agentConfigs.length,
      profilesCount: simulation?.profiles_count || 0,
      entityTypes,
      configReasoning: normalizeConfigReasoning(simulation?.config_reasoning || config?.generation_reasoning || ''),
      config: normalizedConfig
    },
    run: run || null,
    report: {
      reportId: report?.report_id,
      status: report?.status,
      outline: reportOutline,
      progress: progress || null,
      sections: sections || [],
      consoleLog: consoleLog || [],
      agentLog: agentLog || []
    },
    steps
  }
}

export async function gatherReportArtifacts({ reportId, simulationId = null, baseUrl = DEFAULT_BACKEND_BASE_URL }) {
  const report = await mirofishJson(`/api/report/${reportId}`, { baseUrl })
  const resolvedSimulationId = simulationId || report?.simulation_id
  const simulation = resolvedSimulationId
    ? await mirofishJson(`/api/simulation/${resolvedSimulationId}`, { baseUrl })
    : null
  const project = simulation?.project_id
    ? await mirofishJson(`/api/graph/project/${simulation.project_id}`, { baseUrl })
    : null
  const graphId = report?.graph_id || simulation?.graph_id || project?.graph_id

  const [graph, config, runDetail, runBasic, progress, sectionsData, consoleData, agentData] = await Promise.all([
    graphId ? tryMirofishJson(`/api/graph/data/${graphId}`, { baseUrl }) : null,
    resolvedSimulationId ? tryMirofishJson(`/api/simulation/${resolvedSimulationId}/config`, { baseUrl }) : null,
    resolvedSimulationId ? tryMirofishJson(`/api/simulation/${resolvedSimulationId}/run-status/detail`, { baseUrl }) : null,
    resolvedSimulationId ? tryMirofishJson(`/api/simulation/${resolvedSimulationId}/run-status`, { baseUrl }) : null,
    reportId ? tryMirofishJson(`/api/report/${reportId}/progress`, { baseUrl }) : null,
    reportId ? tryMirofishJson(`/api/report/${reportId}/sections`, { baseUrl }) : null,
    reportId ? tryMirofishJson(`/api/report/${reportId}/console-log/stream`, { baseUrl }) : null,
    reportId ? tryMirofishJson(`/api/report/${reportId}/agent-log/stream`, { baseUrl }) : null
  ])

  const run = runDetail || runBasic || null
  const sections = sectionsData?.sections || []
  const consoleLog = consoleData?.logs || []
  const agentLog = agentData?.logs || []

  return {
    graph: project || graph ? buildGraphArtifact({ project, graph }) : null,
    workbench: buildWorkbenchArtifact({
      project,
      simulation,
      config,
      run,
      report,
      progress,
      sections,
      consoleLog,
      agentLog,
      graph
    })
  }
}
