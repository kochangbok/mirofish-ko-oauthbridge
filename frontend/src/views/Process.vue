<template>
  <div class="process-page">

    <nav class="navbar">
      <div class="nav-brand" @click="goHome">MIROFISH</div>


      <div class="nav-center">
        <div class="step-badge">STEP 01</div>
        <div class="step-name">지도 구축</div>
      </div>

      <div class="nav-status">
        <span class="status-dot" :class="statusClass"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </nav>


    <div class="main-content">

      <div class="left-panel" :class="{ 'full-screen': isFullScreen }">
        <div class="panel-header">
          <div class="header-left">
            <span class="header-deco">◆</span>
            <span class="header-title">실시간 지식 그래프</span>
          </div>
          <div class="header-right">
            <template v-if="graphData">
              <span class="stat-item">{{ graphData.node_count || graphData.nodes?.length || 0 }} 마디</span>
              <span class="stat-divider">|</span>
              <span class="stat-item">{{ graphData.edge_count || graphData.edges?.length || 0 }} 관계</span>
              <span class="stat-divider">|</span>
            </template>
            <div class="action-buttons">
                <button class="action-btn" @click="refreshGraph" :disabled="graphLoading" title="지도 새로고침">
                  <span class="icon-refresh" :class="{ 'spinning': graphLoading }">↻</span>
                </button>
                <button class="action-btn" @click="toggleFullScreen" :title="isFullScreen ? '전체 화면 종료' : '전체 화면 표시'">
                  <span class="icon-fullscreen">{{ isFullScreen ? '↙' : '↗' }}</span>
                </button>
            </div>
          </div>
        </div>

        <div class="graph-container" ref="graphContainer">

          <div v-if="graphData" class="graph-view">
            <svg ref="graphSvg" class="graph-svg"></svg>

            <div v-if="currentPhase === 1" class="graph-building-hint">
              <span class="building-dot"></span>
              실시간 업데이트 중...
            </div>


            <div v-if="selectedItem" class="detail-panel">
              <div class="detail-panel-header">
                <span class="detail-title">{{ selectedItem.type === 'node' ? 'Node Details' : 'Relationship' }}</span>
                <span v-if="selectedItem.type === 'node'" class="detail-badge" :style="{ background: selectedItem.color }">
                  {{ selectedItem.entityType }}
                </span>
                <button class="detail-close" @click="closeDetailPanel">×</button>
              </div>


              <div v-if="selectedItem.type === 'node'" class="detail-content">
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value highlight">{{ selectedItem.data.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">UUID:</span>
                  <span class="detail-value uuid">{{ selectedItem.data.uuid }}</span>
                </div>
                <div class="detail-row" v-if="selectedItem.data.created_at">
                  <span class="detail-label">Created:</span>
                  <span class="detail-value">{{ formatDate(selectedItem.data.created_at) }}</span>
                </div>


                <div class="detail-section" v-if="selectedItem.data.attributes && Object.keys(selectedItem.data.attributes).length > 0">
                  <span class="detail-label">Properties:</span>
                  <div class="properties-list">
                    <div v-for="(value, key) in selectedItem.data.attributes" :key="key" class="property-item">
                      <span class="property-key">{{ key }}:</span>
                      <span class="property-value">{{ value }}</span>
                    </div>
                  </div>
                </div>


                <div class="detail-section" v-if="selectedItem.data.summary">
                  <span class="detail-label">Summary:</span>
                  <p class="detail-summary">{{ selectedItem.data.summary }}</p>
                </div>


                <div class="detail-row" v-if="selectedItem.data.labels?.length">
                  <span class="detail-label">Labels:</span>
                  <div class="detail-labels">
                    <span v-for="label in selectedItem.data.labels" :key="label" class="label-tag">{{ label }}</span>
                  </div>
                </div>
              </div>


              <div v-else class="detail-content">

                <div class="edge-relation">
                  <span class="edge-source">{{ selectedItem.data.source_name || selectedItem.data.source_node_name }}</span>
                  <span class="edge-arrow">→</span>
                  <span class="edge-type">{{ selectedItem.data.name || selectedItem.data.fact_type || 'RELATED_TO' }}</span>
                  <span class="edge-arrow">→</span>
                  <span class="edge-target">{{ selectedItem.data.target_name || selectedItem.data.target_node_name }}</span>
                </div>

                <div class="detail-subtitle">Relationship</div>

                <div class="detail-row">
                  <span class="detail-label">UUID:</span>
                  <span class="detail-value uuid">{{ selectedItem.data.uuid }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Label:</span>
                  <span class="detail-value">{{ selectedItem.data.name || selectedItem.data.fact_type || 'RELATED_TO' }}</span>
                </div>
                <div class="detail-row" v-if="selectedItem.data.fact_type">
                  <span class="detail-label">Type:</span>
                  <span class="detail-value">{{ selectedItem.data.fact_type }}</span>
                </div>


                <div class="detail-section" v-if="selectedItem.data.fact">
                  <span class="detail-label">Fact:</span>
                  <p class="detail-summary">{{ selectedItem.data.fact }}</p>
                </div>


                <div class="detail-section" v-if="selectedItem.data.episodes?.length">
                  <span class="detail-label">Episodes:</span>
                  <div class="episodes-list">
                    <span v-for="ep in selectedItem.data.episodes" :key="ep" class="episode-tag">{{ ep }}</span>
                  </div>
                </div>

                <div class="detail-row" v-if="selectedItem.data.created_at">
                  <span class="detail-label">Created:</span>
                  <span class="detail-value">{{ formatDate(selectedItem.data.created_at) }}</span>
                </div>
                <div class="detail-row" v-if="selectedItem.data.valid_at">
                  <span class="detail-label">Valid From:</span>
                  <span class="detail-value">{{ formatDate(selectedItem.data.valid_at) }}</span>
                </div>
                <div class="detail-row" v-if="selectedItem.data.invalid_at">
                  <span class="detail-label">Invalid At:</span>
                  <span class="detail-value">{{ formatDate(selectedItem.data.invalid_at) }}</span>
                </div>
                <div class="detail-row" v-if="selectedItem.data.expired_at">
                  <span class="detail-label">Expired At:</span>
                  <span class="detail-value">{{ formatDate(selectedItem.data.expired_at) }}</span>
                </div>
              </div>
            </div>
          </div>


          <div v-else-if="graphLoading" class="graph-loading">
            <div class="loading-animation">
              <div class="loading-ring"></div>
              <div class="loading-ring"></div>
              <div class="loading-ring"></div>
            </div>
            <p class="loading-text">스펙트럼 데이터 로딩...</p>
          </div>


          <div v-else-if="currentPhase < 1" class="graph-waiting">
            <div class="waiting-icon">
              <svg viewBox="0 0 100 100" class="network-icon">
                <circle cx="50" cy="20" r="8" fill="none" stroke="#000" stroke-width="1.5"/>
                <circle cx="20" cy="60" r="8" fill="none" stroke="#000" stroke-width="1.5"/>
                <circle cx="80" cy="60" r="8" fill="none" stroke="#000" stroke-width="1.5"/>
                <circle cx="50" cy="80" r="8" fill="none" stroke="#000" stroke-width="1.5"/>
                <line x1="50" y1="28" x2="25" y2="54" stroke="#000" stroke-width="1"/>
                <line x1="50" y1="28" x2="75" y2="54" stroke="#000" stroke-width="1"/>
                <line x1="28" y1="60" x2="72" y2="60" stroke="#000" stroke-width="1" stroke-dasharray="4"/>
                <line x1="50" y1="72" x2="26" y2="66" stroke="#000" stroke-width="1"/>
                <line x1="50" y1="72" x2="74" y2="66" stroke="#000" stroke-width="1"/>
              </svg>
            </div>
            <p class="waiting-text">온톨로지가 생성되기를 기다리는 중</p>
            <p class="waiting-hint">생성이 완료되면 자동으로 지도 작성이 시작됩니다.</p>
          </div>


          <div v-else-if="error" class="graph-error">
            <span class="error-icon">⚠</span>
            <p>{{ error }}</p>
          </div>
        </div>


        <div v-if="graphData" class="graph-legend">
          <div class="legend-item" v-for="type in entityTypes" :key="type.name">
            <span class="legend-dot" :style="{ background: type.color }"></span>
            <span class="legend-label">{{ type.name }}</span>
            <span class="legend-count">{{ type.count }}</span>
          </div>
        </div>
      </div>


      <div class="right-panel" :class="{ 'hidden': isFullScreen }">
        <div class="panel-header dark-header">
          <span class="header-icon">▣</span>
          <span class="header-title">빌드 프로세스</span>
        </div>

        <div class="process-content">

              <div class="detail-section" v-if="ontologyProgress && currentPhase === 0">
                <div class="detail-label">빌드 진행</div>
                <div class="ontology-progress">
                  <div class="progress-spinner"></div>
                  <span class="progress-text">{{ ontologyProgress.message }}</span>
                </div>
              </div>


              <div class="detail-section" v-if="projectData?.ontology">
                <div class="detail-label">생성된 엔터티 유형({{ projectData.ontology.entity_types?.length || 0 }})</div>
                <div class="entity-tags">
                  <span
                    v-for="entity in projectData.ontology.entity_types"
                    :key="entity.name"
                    class="entity-tag"
                  >
                    {{ entity.name }}
                  </span>
                </div>
              </div>

              <div class="detail-section" v-if="projectData?.ontology">
                <div class="detail-label">생성된 관계 유형({{ projectData.ontology.relation_types?.length || 0 }})</div>
                <div class="relation-list">
                  <div
                    v-for="(rel, idx) in projectData.ontology.relation_types?.slice(0, 5) || []"
                    :key="idx"
                    class="relation-item"
                  >
                    <span class="rel-source">{{ rel.source_type }}</span>
                    <span class="rel-arrow">→</span>
                    <span class="rel-name">{{ rel.name }}</span>
                    <span class="rel-arrow">→</span>
                    <span class="rel-target">{{ rel.target_type }}</span>
                  </div>
                  <div v-if="(projectData.ontology.relation_types?.length || 0) > 5" class="relation-more">
                    +{{ projectData.ontology.relation_types.length - 5 }} 더 많은 관계...
                  </div>
                </div>
              </div>


              <div class="detail-section waiting-state" v-if="!projectData?.ontology && currentPhase === 0 && !ontologyProgress">
                <div class="waiting-hint">온톨로지가 생성되기를 기다리는 중...</div>
              </div>
            </div>
          </div>


          <div class="process-phase" :class="{ 'active': currentPhase === 1, 'completed': currentPhase > 1 }">
            <div class="phase-header">
              <span class="phase-num">02</span>
              <div class="phase-info">
                <div class="phase-title">지도 구축</div>
                <div class="phase-api">/api/graph/build</div>
              </div>
              <span class="phase-status" :class="getPhaseStatusClass(1)">
                {{ getPhaseStatusText(1) }}
              </span>
            </div>

            <div class="phase-detail">
              <div class="detail-section">
                <div class="detail-label">인터페이스 설명</div>
                <div class="detail-content">
                  생성된 온톨로지를 기반으로 문서를 블록으로 나누고 Zep API를 호출하여 지식 그래프를 구축하고 개체와 관계를 추출합니다.
                </div>
              </div>


              <div class="detail-section" v-if="buildProgress && currentPhase >= 1">
                <div class="detail-label">빌드 진행</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: buildProgress.progress + '%' }"></div>
                </div>
                <div class="progress-info">
                  <span class="progress-message">{{ buildProgress.message }}</span>
                  <span class="progress-percent">{{ buildProgress.progress }}%</span>
                </div>
              </div>

              <div class="detail-section" v-if="graphData">
                <div class="detail-label">결과 구축</div>
                <div class="build-result">
                  <div class="result-item">
                    <span class="result-value">{{ graphData.node_count }}</span>
                    <span class="result-label">엔터티 노드</span>
                  </div>
                  <div class="result-item">
                    <span class="result-value">{{ graphData.edge_count }}</span>
                    <span class="result-label">관계 가장자리</span>
                  </div>
                  <div class="result-item">
                    <span class="result-value">{{ entityTypes.length }}</span>
                    <span class="result-label">엔터티 유형</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div class="process-phase" :class="{ 'active': currentPhase === 2, 'completed': currentPhase > 2 }">
            <div class="phase-header">
              <span class="phase-num">03</span>
              <div class="phase-info">
                <div class="phase-title">빌드 완료</div>
                <div class="phase-api">다음 단계로 진행할 준비가 되었습니다.</div>
              </div>
              <span class="phase-status" :class="getPhaseStatusClass(2)">
                {{ getPhaseStatusText(2) }}
              </span>
            </div>
          </div>


          <div class="next-step-section" v-if="currentPhase >= 2">
            <button class="next-step-btn" @click="goToNextStep" :disabled="currentPhase < 2">
              환경설정 들어가기
              <span class="btn-arrow">→</span>
            </button>
          </div>
        </div>


        <div class="project-panel">
          <div class="project-header">
            <span class="project-icon">◇</span>
            <span class="project-title">프로젝트 정보</span>
          </div>
          <div class="project-details" v-if="projectData">
            <div class="project-item">
              <span class="item-label">프로젝트 이름</span>
              <span class="item-value">{{ projectData.name }}</span>
            </div>
            <div class="project-item">
              <span class="item-label">프로젝트 ID</span>
              <span class="item-value code">{{ projectData.project_id }}</span>
            </div>
            <div class="project-item" v-if="projectData.graph_id">
              <span class="item-label">지도 ID</span>
              <span class="item-value code">{{ projectData.graph_id }}</span>
            </div>
            <div class="project-item">
              <span class="item-label">시뮬레이션 요구 사항</span>
              <span class="item-value">{{ projectData.simulation_requirement || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { generateOntology, getProject, buildGraph, getTaskStatus, getGraphData } from '../api/graph'
import { getBridgeHealth } from '../api'
import { createSimulation } from '../api/simulation'
import { getPendingUpload, clearPendingUpload } from '../store/pendingUpload'
import * as d3 from 'd3'

const route = useRoute()
const router = useRouter()

// 현재 프로젝트 ID(아마도'new'실제 ID로)
const currentProjectId = ref(route.params.projectId)

// 상태
const loading = ref(true)
const graphLoading = ref(false)
const error = ref('')
const projectData = ref(null)
const graphData = ref(null)
const buildProgress = ref(null)
const ontologyProgress = ref(null) // 온톨로지 생성 진행
const currentPhase = ref(-1) // -1: 업로드 중, 0: 온톨로지가 생성되고 있습니다, 1: 지도 구축, 2: 마치다
const selectedItem = ref(null) // 선택한 노드 또는 가장자리
const isFullScreen = ref(false)

// DOM인용하다
const graphContainer = ref(null)
const graphSvg = ref(null)

// 폴링 타이머
let pollTimer = null

// 계산된 속성
const statusClass = computed(() => {
  if (error.value) return 'error'
  if (currentPhase.value >= 2) return 'completed'
  return 'processing'
})

const statusText = computed(() => {
  if (error.value) return '빌드 실패'
  if (currentPhase.value >= 2) return '빌드 완료'
  if (currentPhase.value === 1) return '지도 제작 중'
  if (currentPhase.value === 0) return '온톨로지가 생성되고 있습니다'
  return '초기화 중'
})

const entityTypes = computed(() => {
  if (!graphData.value?.nodes) return []

  const typeMap = {}
  const colors = ['#FF6B35', '#004E89', '#7B2D8E', '#1A936F', '#C5283D', '#E9724C']

  graphData.value.nodes.forEach(node => {
    const type = node.labels?.find(l => l !== 'Entity') || 'Entity'
    if (!typeMap[type]) {
      typeMap[type] = { name: type, count: 0, color: colors[Object.keys(typeMap).length % colors.length] }
    }
    typeMap[type].count++
  })

  return Object.values(typeMap)
})

// 방법
const goHome = () => {
  router.push('/')
}

const goToNextStep = async () => {
  if (!projectData.value?.project_id || !projectData.value?.graph_id) {
    error.value = '프로젝트 또는 그래프 정보가 없어 환경 구축 단계로 이동할 수 없습니다.'
    return
  }

  try {
    const response = await createSimulation({
      project_id: projectData.value.project_id,
      graph_id: projectData.value.graph_id,
      enable_twitter: true,
      enable_reddit: true
    })

    if (response.success && response.data?.simulation_id) {
      router.push({
        name: 'Simulation',
        params: { simulationId: response.data.simulation_id }
      })
      return
    }

    error.value = response.error || '시뮬레이션 생성 실패'
  } catch (err) {
    error.value = '시뮬레이션 생성 실패: ' + (err.message || '알 수 없는 오류')
  }
}

const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value
  // Wait for transition to finish then re-render graph
  setTimeout(() => {
    renderGraph()
  }, 350)
}

// 세부정보 패널 닫기
const closeDetailPanel = () => {
  selectedItem.value = null
}

// 날짜 형식
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

// 노드 선택
const selectNode = (nodeData, color) => {
  selectedItem.value = {
    type: 'node',
    data: nodeData,
    color: color,
    entityType: nodeData.labels?.find(l => l !== 'Entity' && l !== 'Node') || 'Entity'
  }
}

// 가장자리 선택
const selectEdge = (edgeData) => {
  selectedItem.value = {
    type: 'edge',
    data: edgeData
  }
}

const getPhaseStatusClass = (phase) => {
  if (currentPhase.value > phase) return 'completed'
  if (currentPhase.value === phase) return 'active'
  return 'pending'
}

const getPhaseStatusText = (phase) => {
  if (currentPhase.value > phase) return '완전한'
  if (currentPhase.value === phase) {
    if (phase === 1 && buildProgress.value) {
      return `${buildProgress.value.progress}%`
    }
    return '진행 중'
  }
  return '대기 중'
}

// 초기화 - 새 프로젝트 처리 또는 기존 프로젝트 로드
const initProject = async () => {
  const paramProjectId = route.params.projectId

  if (paramProjectId === 'new') {
    // 새 프로젝트 만들기: 업로드할 데이터를 스토어에서 가져옵니다.
    await handleNewProject()
  } else {
    // 기존 프로젝트 로드
    currentProjectId.value = paramProjectId
    await loadProject()
  }
}

const checkBridgeBeforeOntology = async () => {
  const bridge = await getBridgeHealth()

  if (!bridge?.ok || !bridge?.providerAvailable) {
    throw new Error('로컬 브리지를 사용할 수 없습니다. dev:all을 다시 실행하고 http://127.0.0.1:8787/health 를 확인해 주세요.')
  }

  if (bridge.busy) {
    const queued = Number.isFinite(bridge.queueDepth) ? bridge.queueDepth : 0
    ontologyProgress.value = {
      message: queued > 0
        ? `로컬 브리지가 사용 중입니다. 현재 요청 뒤에 ${queued}건 대기 중입니다...`
        : '로컬 브리지가 사용 중입니다. 현재 요청이 끝날 때까지 기다리는 중입니다...'
    }
  }
}

// 새로운 프로젝트 처리 - 온톨로지 호출/generate API
const handleNewProject = async () => {
  const pending = getPendingUpload()

  if (!pending.isPending || pending.files.length === 0) {
    error.value = '업로드할 파일이 없습니다. 홈페이지로 돌아가서 다시 시도해 주세요.'
    loading.value = false
    return
  }

  try {
    loading.value = true
    currentPhase.value = 0 // 온톨로지 생성 단계
    ontologyProgress.value = { message: '파일 업로드 및 문서 분석...' }

    await checkBridgeBeforeOntology()

    // FormData 빌드
    const formDataObj = new FormData()
    pending.files.forEach(file => {
      formDataObj.append('files', file)
    })
    formDataObj.append('simulation_requirement', pending.simulationRequirement)

    // 온톨로지 생성 API 호출
    const response = await generateOntology(formDataObj)

    if (response.success) {
      // 업로드할 데이터 지우기
      clearPendingUpload()

      // 프로젝트 ID 및 데이터 업데이트
      currentProjectId.value = response.data.project_id
      projectData.value = response.data

      // URL 업데이트(페이지를 새로 고치지 않음)
      router.replace({
        name: 'Process',
        params: { projectId: response.data.project_id }
      })

      ontologyProgress.value = null

      // 자동으로 지도 생성 시작
      await startBuildGraph()
    } else {
      error.value = response.error || '온톨로지 생성 실패'
    }
  } catch (err) {
    console.error('Handle new project error:', err)
    error.value = '프로젝트 초기화 실패: ' + (err.message || '알 수 없는 오류')
  } finally {
    loading.value = false
  }
}

// 기존 프로젝트 데이터 로드
const loadProject = async () => {
  try {
    loading.value = true
    const response = await getProject(currentProjectId.value)

    if (response.success) {
      projectData.value = response.data
      updatePhaseByStatus(response.data.status)

      // 자동으로 지도 생성 시작
      if (response.data.status === 'ontology_generated' && !response.data.graph_id) {
        await startBuildGraph()
      }

      // 빌드의 작업에 대해 계속 폴링
      if (response.data.status === 'graph_building' && response.data.graph_build_task_id) {
        currentPhase.value = 1
        startPollingTask(response.data.graph_build_task_id)
      }

      // 완성된 지도 로드
      if (response.data.status === 'graph_completed' && response.data.graph_id) {
        currentPhase.value = 2
        await loadGraph(response.data.graph_id)
      }
    } else {
      error.value = response.error || '프로젝트를 로드하지 못했습니다.'
    }
  } catch (err) {
    console.error('Load project error:', err)
    error.value = '프로젝트를 로드하지 못했습니다.: ' + (err.message || '알 수 없는 오류')
  } finally {
    loading.value = false
  }
}

const updatePhaseByStatus = (status) => {
  switch (status) {
    case 'created':
    case 'ontology_generated':
      currentPhase.value = 0
      break
    case 'graph_building':
      currentPhase.value = 1
      break
    case 'graph_completed':
      currentPhase.value = 2
      break
    case 'failed':
      error.value = projectData.value?.error || '처리 실패'
      break
  }
}

// 그래프 작성 시작
const startBuildGraph = async () => {
  try {
    currentPhase.value = 1
    // 초기 진행 상황 설정
    buildProgress.value = {
      progress: 0,
      message: '그래프 구성 시작...'
    }

    const response = await buildGraph({ project_id: currentProjectId.value })

    if (response.success) {
      buildProgress.value.message = '그래프 구성 작업이 시작되었습니다...'

      // 작업 저장_id 여론조사를 위해
      const taskId = response.data.task_id

      // 그래프 데이터 폴링 시작(작업 상태 폴링과 무관)
      startGraphPolling()

      // 작업 상태 폴링 시작
      startPollingTask(taskId)
    } else {
      error.value = response.error || '그래프 작성을 시작하지 못했습니다.'
      buildProgress.value = null
    }
  } catch (err) {
    console.error('Build graph error:', err)
    error.value = '그래프 작성을 시작하지 못했습니다.: ' + (err.message || '알 수 없는 오류')
    buildProgress.value = null
  }
}

// 그래프 데이터 폴링 타이머
let graphPollTimer = null

// 그래프 데이터 폴링 시작
const startGraphPolling = () => {
  // 지금 받으세요
  fetchGraphData()

  // 10초마다 자동으로 스펙트럼 데이터 수집
  graphPollTimer = setInterval(async () => {
    await fetchGraphData()
  }, 10000)
}

// 수동으로 지도 새로고침
const refreshGraph = async () => {
  graphLoading.value = true
  await fetchGraphData()
  graphLoading.value = false
}

// 그래프 데이터 폴링 중지
const stopGraphPolling = () => {
  if (graphPollTimer) {
    clearInterval(graphPollTimer)
    graphPollTimer = null
  }
}

// 지도 데이터 가져오기
const fetchGraphData = async () => {
  try {
    // 그래프를 얻으려면 먼저 프로젝트 정보를 얻으십시오._id
    const projectResponse = await getProject(currentProjectId.value)

    if (projectResponse.success && projectResponse.data.graph_id) {
      const graphId = projectResponse.data.graph_id
      projectData.value = projectResponse.data

      if (projectResponse.data.status === 'graph_completed' && currentPhase.value !== 2) {
        console.log('✅ Project recovered/completed while polling graph data')
        currentPhase.value = 2
        stopPolling()
        stopGraphPolling()
        buildProgress.value = {
          progress: 100,
          message: '지도 구축 완료'
        }
      }

      // 지도 데이터 가져오기
      const graphResponse = await getGraphData(graphId)

      if (graphResponse.success && graphResponse.data) {
        const newData = graphResponse.data
        const newNodeCount = newData.node_count || newData.nodes?.length || 0
        const oldNodeCount = graphData.value?.node_count || graphData.value?.nodes?.length || 0

        console.log('Fetching graph data, nodes:', newNodeCount, 'edges:', newData.edge_count || newData.edges?.length || 0)

        // 데이터 변경 시 렌더링 업데이트
        if (newNodeCount !== oldNodeCount || !graphData.value) {
          graphData.value = newData
          await nextTick()
          renderGraph()
        }
      }
    }
  } catch (err) {
    console.log('Graph data fetch:', err.message || 'not ready')
  }
}

// 폴링 작업 상태
const startPollingTask = (taskId) => {
  // 즉시 쿼리 실행
  pollTaskStatus(taskId)

  // 그런 다음 정기적으로 여론 조사
  pollTimer = setInterval(() => {
    pollTaskStatus(taskId)
  }, 2000)
}

// 쿼리 작업 상태
const pollTaskStatus = async (taskId) => {
  try {
    const response = await getTaskStatus(taskId)

    if (response.success) {
      const task = response.data

      // 업데이트 진행상황 표시
      buildProgress.value = {
        progress: task.progress || 0,
        message: task.message || '처리...'
      }

      console.log('Task status:', task.status, 'Progress:', task.progress)

      if (task.status === 'completed') {
        console.log('✅ 그래프 구성이 완료되고 전체 데이터가 로드되는 중입니다....')

        stopPolling()
        stopGraphPolling()
        currentPhase.value = 2

        // 업데이트 진행 상황이 완료로 표시됩니다.
        buildProgress.value = {
          progress: 100,
          message: '건설이 완료되고 지도가 로드되는 중입니다....'
        }

        // 그래프를 얻으려면 프로젝트 데이터를 다시 로드하세요._id
        const projectResponse = await getProject(currentProjectId.value)
        if (projectResponse.success) {
          projectData.value = projectResponse.data

          // 마지막으로 전체 스펙트럼 데이터를 로드합니다.
          if (projectResponse.data.graph_id) {
            console.log('📊 전체 지도 로드:', projectResponse.data.graph_id)
            await loadGraph(projectResponse.data.graph_id)
            console.log('✅ 지도 로딩 완료')
          }
        }

        // 진행 상황 표시 지우기
        buildProgress.value = null
      } else if (task.status === 'failed') {
        stopPolling()
        stopGraphPolling()
        error.value = '그래프 구성에 실패했습니다.: ' + (task.error || '알 수 없는 오류')
        buildProgress.value = null
      }
    }
  } catch (err) {
    console.error('Poll task error:', err)
  }
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 지도 데이터 로드
const loadGraph = async (graphId) => {
  try {
    graphLoading.value = true
    const response = await getGraphData(graphId)

    if (response.success) {
      graphData.value = response.data
      await nextTick()
      renderGraph()
    }
  } catch (err) {
    console.error('Load graph error:', err)
  } finally {
    graphLoading.value = false
  }
}

// 렌더링 맵(D3.js)
const renderGraph = () => {
  if (!graphSvg.value || !graphData.value) {
    console.log('Cannot render: svg or data missing')
    return
  }

  const container = graphContainer.value
  if (!container) {
    console.log('Cannot render: container missing')
    return
  }

  // 컨테이너 크기 가져오기
  const rect = container.getBoundingClientRect()
  const width = rect.width || 800
  const height = (rect.height || 600) - 60

  if (width <= 0 || height <= 0) {
    console.log('Cannot render: invalid dimensions', width, height)
    return
  }

  console.log('Rendering graph:', width, 'x', height)

  const svg = d3.select(graphSvg.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  svg.selectAll('*').remove()

  // 노드 데이터 처리
  const nodesData = graphData.value.nodes || []
  const edgesData = graphData.value.edges || []

  if (nodesData.length === 0) {
    console.log('No nodes to render')
    // 빈 상태 표시
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#999')
      .text('지도 데이터를 기다리는 중...')
    return
  }

  // 이름 검색을 위한 노드 맵 만들기
  const nodeMap = {}
  nodesData.forEach(n => {
    nodeMap[n.uuid] = n
  })

  const nodes = nodesData.map(n => ({
    id: n.uuid,
    name: n.name || '이름 없음',
    type: n.labels?.find(l => l !== 'Entity' && l !== 'Node') || 'Entity',
    rawData: n // 원본 데이터 저장
  }))

  // 유효한 가장자리를 필터링하도록 설정된 노드 ID를 만듭니다.
  const nodeIds = new Set(nodes.map(n => n.id))

  const edges = edgesData
    .filter(e => nodeIds.has(e.source_node_uuid) && nodeIds.has(e.target_node_uuid))
    .map(e => ({
      source: e.source_node_uuid,
      target: e.target_node_uuid,
      type: e.fact_type || e.name || 'RELATED_TO',
      rawData: {
        ...e,
        source_name: nodeMap[e.source_node_uuid]?.name || '알려지지 않은',
        target_name: nodeMap[e.target_node_uuid]?.name || '알려지지 않은'
      }
    }))

  console.log('Nodes:', nodes.length, 'Edges:', edges.length)

  // 컬러 맵
  const types = [...new Set(nodes.map(n => n.type))]
  const colorScale = d3.scaleOrdinal()
    .domain(types)
    .range(['#FF6B35', '#004E89', '#7B2D8E', '#1A936F', '#C5283D', '#E9724C', '#2D3436', '#6C5CE7'])

  // 강제 지향 레이아웃
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(100).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(40))
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.05))

  // 줌 기능 추가
  const g = svg.append('g')

  svg.call(d3.zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([0.2, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    }))

  // 가장자리 그리기(클릭 가능한 투명하고 넓은 선 포함)
  const linkGroup = g.append('g')
    .attr('class', 'links')
    .selectAll('g')
    .data(edges)
    .enter()
    .append('g')
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      event.stopPropagation()
      selectEdge(d.rawData)
    })

  // 보이는 얇은 선
  const link = linkGroup.append('line')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.6)

  // 클릭을 위한 투명한 넓은 라인
  linkGroup.append('line')
    .attr('stroke', 'transparent')
    .attr('stroke-width', 10)

  // 가장자리 라벨
  const linkLabel = g.append('g')
    .attr('class', 'link-labels')
    .selectAll('text')
    .data(edges)
    .enter()
    .append('text')
    .attr('font-size', '9px')
    .attr('fill', '#999')
    .attr('text-anchor', 'middle')
    .text(d => d.type.length > 15 ? d.type.substring(0, 12) + '...' : d.type)

  // 그리기 노드
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      event.stopPropagation()
      selectNode(d.rawData, colorScale(d.type))
    })
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))

  node.append('circle')
    .attr('r', 10)
    .attr('fill', d => colorScale(d.type))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .attr('class', 'node-circle')

  node.append('text')
    .attr('dx', 14)
    .attr('dy', 4)
    .text(d => d.name?.substring(0, 12) || '')
    .attr('font-size', '11px')
    .attr('fill', '#333')
    .attr('font-family', 'JetBrains Mono, monospace')

  // 세부정보 패널을 닫으려면 빈 공간을 클릭하세요.
  svg.on('click', () => {
    closeDetailPanel()
  })

  simulation.on('tick', () => {
    // 모든 가장자리의 위치 업데이트(보이는 선 및 투명한 히트 영역 포함)
    linkGroup.selectAll('line')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    // 가장자리 레이블 위치 업데이트
    linkLabel
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2 - 5)

    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }
}

// 그래프 데이터의 변화 모니터링
watch(graphData, () => {
  if (graphData.value) {
    nextTick(() => renderGraph())
  }
})

// 수명주기
onMounted(() => {
  initProject()
})

onUnmounted(() => {
  stopPolling()
  stopGraphPolling()
})
</script>

<style scoped>
/* 변하기 쉬운 */
:root {
  --black: #000000;
  --white: #FFFFFF;
  --orange: #FF6B35;
  --gray-light: #F5F5F5;
  --gray-border: #E0E0E0;
  --gray-text: #666666;
}

.process-page {
  min-height: 100vh;
  background: var(--white);
  font-family: 'JetBrains Mono', 'Noto Sans KR', monospace;
  overflow: hidden; /* Prevent body scroll in fullscreen */
}

/* 네비게이션 바 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: #000;
  color: #fff;
  z-index: 10;
  position: relative;
}

.nav-brand {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: opacity 0.2s;
}

.nav-brand:hover {
  opacity: 0.8;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.step-badge {
  background: #FF6B35;
  color: #fff;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  border-radius: 2px;
}

.step-name {
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  color: #fff;
}

.nav-status {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #666;
  margin-right: 8px;
}

.status-dot.processing {
  background: #FF6B35;
  animation: pulse 1.5s infinite;
}

.status-dot.completed {
  background: #1A936F;
}

.status-dot.error {
  background: #C5283D;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 0.75rem;
  color: #999;
}

/* 주요 콘텐츠 영역 */
.main-content {
  display: flex;
  height: calc(100vh - 56px);
  position: relative;
}

/* 왼쪽 패널 - 기본값 50% */
.left-panel {
  width: 50%;
  flex: none; /* Fixed width initially */
  display: flex;
  flex-direction: column;
  border-right: 1px solid #E0E0E0;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  z-index: 5;
}

.left-panel.full-screen {
  width: 100%;
  border-right: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #E0E0E0;
  background: #fff;
  height: 50px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-deco {
  color: #FF6B35;
  font-size: 0.8rem;
}

.header-title {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.75rem;
  color: #666;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-val {
  font-weight: 600;
  color: #333;
}

.stat-divider {
  color: #eee;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  border-radius: 2px;
}

.action-btn:hover:not(:disabled) {
  background: #F5F5F5;
  color: #000;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.icon-refresh, .icon-fullscreen {
  font-size: 1rem;
  line-height: 1;
}

.icon-refresh.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 그래프 컨테이너 */
.graph-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.graph-loading,
.graph-waiting,
.graph-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.loading-animation {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
}

.loading-ring {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 50%;
  animation: ring-rotate 1.5s linear infinite;
}

.loading-ring:nth-child(1) {
  width: 80px;
  height: 80px;
  border-top-color: #000;
}

.loading-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  top: 10px;
  left: 10px;
  border-right-color: #FF6B35;
  animation-delay: 0.2s;
}

.loading-ring:nth-child(3) {
  width: 40px;
  height: 40px;
  top: 20px;
  left: 20px;
  border-bottom-color: #666;
  animation-delay: 0.4s;
}

@keyframes ring-rotate {
  to { transform: rotate(360deg); }
}

.loading-text,
.waiting-text {
  font-size: 0.9rem;
  color: #333;
  margin: 0 0 8px;
}

.waiting-hint {
  font-size: 0.8rem;
  color: #999;
  margin: 0;
}

.waiting-icon {
  margin-bottom: 20px;
}

.network-icon {
  width: 100px;
  height: 100px;
  opacity: 0.6;
}

.graph-view {
  width: 100%;
  height: 100%;
  position: relative;
}

.graph-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.graph-building-hint {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid #FF6B35;
  font-size: 0.8rem;
  color: #FF6B35;
}

.building-dot {
  width: 8px;
  height: 8px;
  background: #FF6B35;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

/* 마디/가장자리 세부정보 패널 */
.detail-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 320px;
  max-height: calc(100% - 32px);
  background: #fff;
  border: 1px solid #E0E0E0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.detail-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #FAFAFA;
  border-bottom: 1px solid #E0E0E0;
}

.detail-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.detail-badge {
  padding: 2px 10px;
  font-size: 0.75rem;
  color: #fff;
  border-radius: 2px;
}

.detail-close {
  margin-left: auto;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.detail-close:hover {
  color: #333;
}

.detail-content {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.detail-label {
  font-size: 0.8rem;
  color: #999;
  min-width: 70px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 0.85rem;
  color: #333;
  word-break: break-word;
}

.detail-value.uuid {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #666;
}

.detail-section {
  margin-bottom: 12px;
}

.detail-summary {
  margin: 8px 0 0 0;
  font-size: 0.85rem;
  color: #333;
  line-height: 1.6;
  padding: 10px;
  background: #F9F9F9;
  border-left: 3px solid #FF6B35;
}

.detail-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.label-tag {
  padding: 2px 8px;
  font-size: 0.75rem;
  background: #F0F0F0;
  border: 1px solid #E0E0E0;
  color: #666;
}

/* 엣지 세부 관계 표시 */
.edge-relation {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #F9F9F9;
  border: 1px solid #E0E0E0;
}

.edge-source,
.edge-target {
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
}

.edge-arrow {
  color: #999;
}

.edge-type {
  padding: 2px 8px;
  font-size: 0.75rem;
  background: #FF6B35;
  color: #fff;
}

.detail-value.highlight {
  font-weight: 600;
  color: #000;
}

.detail-subtitle {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin: 16px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #E0E0E0;
}

/* Properties 부동산 목록 */
.properties-list {
  margin-top: 8px;
  padding: 10px;
  background: #F9F9F9;
  border: 1px solid #E0E0E0;
}

.property-item {
  display: flex;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.property-item:last-child {
  margin-bottom: 0;
}

.property-key {
  color: #666;
  margin-right: 8px;
  font-family: 'JetBrains Mono', monospace;
}

.property-value {
  color: #333;
  word-break: break-word;
}

/* Episodes 목록 */
.episodes-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.episode-tag {
  display: block;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  background: #F0F0F0;
  border: 1px solid #E0E0E0;
  color: #666;
  word-break: break-all;
}

.error-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 10px;
}

/* 지도 범례 */
.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 24px;
  border-top: 1px solid #E0E0E0;
  background: #FAFAFA;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-label {
  color: #333;
}

.legend-count {
  color: #999;
}

/* 오른쪽 패널 - 기본값 50% */
.right-panel {
  width: 50%;
  flex: none;
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, transform 0.3s ease;
  overflow: hidden;
  opacity: 1;
}

.right-panel.hidden {
  width: 0;
  opacity: 0;
  transform: translateX(20px);
  pointer-events: none;
}

.right-panel .panel-header.dark-header {
  background: #000;
  color: #fff;
  border-bottom: none;
}

.right-panel .header-icon {
  color: #FF6B35;
  margin-right: 8px;
}

/* 공정 내용 */
.process-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 프로세스 단계 */
.process-phase {
  margin-bottom: 24px;
  border: 1px solid #E0E0E0;
  opacity: 0.5;
  transition: all 0.3s;
}

.process-phase.active,
.process-phase.completed {
  opacity: 1;
}

.process-phase.active {
  border-color: #FF6B35;
}

.process-phase.completed {
  border-color: #1A936F;
}

.phase-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #FAFAFA;
  border-bottom: 1px solid #E0E0E0;
}

.process-phase.active .phase-header {
  background: #FFF5F2;
}

.process-phase.completed .phase-header {
  background: #F2FAF6;
}

.phase-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ddd;
  line-height: 1;
}

.process-phase.active .phase-num {
  color: #FF6B35;
}

.process-phase.completed .phase-num {
  color: #1A936F;
}

.phase-info {
  flex: 1;
}

.phase-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.phase-api {
  font-size: 0.75rem;
  color: #999;
  font-family: 'JetBrains Mono', monospace;
}

.phase-status {
  font-size: 0.75rem;
  padding: 4px 10px;
  background: #eee;
  color: #666;
}

.phase-status.active {
  background: #FF6B35;
  color: #fff;
}

.phase-status.completed {
  background: #1A936F;
  color: #fff;
}

/* 무대 세부정보 */
.phase-detail {
  padding: 16px;
}

/* 엔터티 태그 */
.entity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.entity-tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  background: #F5F5F5;
  border: 1px solid #E0E0E0;
  color: #333;
}

/* 관계 목록 */
.relation-list {
  font-size: 0.8rem;
}

.relation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed #eee;
}

.relation-item:last-child {
  border-bottom: none;
}

.rel-source,
.rel-target {
  color: #333;
}

.rel-arrow {
  color: #ccc;
}

.rel-name {
  color: #FF6B35;
  font-weight: 500;
}

.relation-more {
  padding-top: 8px;
  color: #999;
  font-size: 0.75rem;
}

/* 온톨로지 생성 진행 */
.ontology-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #FFF5F2;
  border: 1px solid #FFE0D6;
}

.progress-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #FFE0D6;
  border-top-color: #FF6B35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.progress-text {
  font-size: 0.85rem;
  color: #333;
}

/* 대기 상태 */
.waiting-state {
  padding: 16px;
  background: #F9F9F9;
  border: 1px dashed #E0E0E0;
  text-align: center;
}

.waiting-hint {
  font-size: 0.85rem;
  color: #999;
}

/* 진행률 표시줄 */
.progress-bar {
  height: 6px;
  background: #E0E0E0;
  margin-bottom: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #FF6B35;
  transition: width 0.3s;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.progress-message {
  color: #666;
}

.progress-percent {
  color: #FF6B35;
  font-weight: 600;
}

/* 결과 구축 */
.build-result {
  display: flex;
  gap: 16px;
}

.result-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #F5F5F5;
}

.result-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #000;
  margin-bottom: 4px;
}

.result-label {
  font-size: 0.7rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 다음 버튼 */
.next-step-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #E0E0E0;
}

.next-step-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: #000;
  color: #fff;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s;
}

.next-step-btn:hover:not(:disabled) {
  background: #FF6B35;
}

.next-step-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-arrow {
  font-size: 1.2rem;
}

/* 프로젝트 정보 패널 */
.project-panel {
  border-top: 1px solid #E0E0E0;
  background: #FAFAFA;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-bottom: 1px solid #E0E0E0;
}

.project-icon {
  color: #FF6B35;
}

.project-title {
  font-size: 0.85rem;
  font-weight: 600;
}

.project-details {
  padding: 16px 24px;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px dashed #E0E0E0;
  font-size: 0.8rem;
}

.project-item:last-child {
  border-bottom: none;
}

.item-label {
  color: #999;
  flex-shrink: 0;
}

.item-value {
  color: #333;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.item-value.code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #666;
}

/* 반응형 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid #E0E0E0;
    height: 50vh;
  }

  .right-panel {
    width: 100% !important;
    height: 50vh;
    opacity: 1 !important;
    transform: none !important;
  }

  .right-panel.hidden {
      display: none;
  }
}
</style>
