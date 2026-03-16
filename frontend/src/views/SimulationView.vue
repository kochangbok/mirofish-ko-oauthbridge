<template>
  <div class="main-view">

    <header class="app-header">
      <div class="header-left">
        <div class="brand" @click="router.push('/')">MIROFISH</div>
      </div>

      <div class="header-center">
        <div class="view-switcher">
          <button
            v-for="mode in ['graph', 'split', 'workbench']"
            :key="mode"
            class="switch-btn"
            :class="{ active: viewMode === mode }"
            @click="viewMode = mode"
          >
            {{ modeLabels[mode] }}
          </button>
        </div>
      </div>

      <div class="header-right">
        <div class="workflow-step">
          <span class="step-num">Step 2/5</span>
          <span class="step-name">{{ t('workflow.envSetup.title') }}</span>
        </div>
        <div class="step-divider"></div>
        <span class="status-indicator" :class="statusClass">
          <span class="dot"></span>
          {{ statusText }}
        </span>
      </div>
    </header>


    <main class="content-area">

      <div class="panel-wrapper left" :style="leftPanelStyle">
        <GraphPanel
          :graphData="graphData"
          :loading="graphLoading"
          :currentPhase="2"
          @refresh="refreshGraph"
          @toggle-maximize="toggleMaximize('graph')"
        />
      </div>


      <div class="panel-wrapper right" :style="rightPanelStyle">
        <Step2EnvSetup
          :simulationId="currentSimulationId"
          :projectData="projectData"
          :graphData="graphData"
          :systemLogs="systemLogs"
          @go-back="handleGoBack"
          @next-step="handleNextStep"
          @add-log="addLog"
          @update-status="updateStatus"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GraphPanel from '../components/GraphPanel.vue'
import Step2EnvSetup from '../components/Step2EnvSetup.vue'
import { getProject, getGraphData } from '../api/graph'
import { getSimulation, stopSimulation, getEnvStatus, closeSimulationEnv } from '../api/simulation'
import { useLocale } from '../i18n'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()

// Props
const props = defineProps({
  simulationId: String
})

// Layout State
const viewMode = ref('split')
const modeLabels = computed(() => ({
  graph: t('common.view.graph'),
  split: t('common.view.split'),
  workbench: t('common.view.workbench')
}))

// Data State
const currentSimulationId = ref(route.params.simulationId)
const projectData = ref(null)
const graphData = ref(null)
const graphLoading = ref(false)
const systemLogs = ref([])
const currentStatus = ref('processing') // processing | completed | error

// --- Computed Layout Styles ---
const leftPanelStyle = computed(() => {
  if (viewMode.value === 'graph') return { width: '100%', opacity: 1, transform: 'translateX(0)' }
  if (viewMode.value === 'workbench') return { width: '0%', opacity: 0, transform: 'translateX(-20px)' }
  return { width: '50%', opacity: 1, transform: 'translateX(0)' }
})

const rightPanelStyle = computed(() => {
  if (viewMode.value === 'workbench') return { width: '100%', opacity: 1, transform: 'translateX(0)' }
  if (viewMode.value === 'graph') return { width: '0%', opacity: 0, transform: 'translateX(20px)' }
  return { width: '50%', opacity: 1, transform: 'translateX(0)' }
})

// --- Status Computed ---
const statusClass = computed(() => {
  return currentStatus.value
})

const statusText = computed(() => {
  if (currentStatus.value === 'error') return t('common.status.error')
  if (currentStatus.value === 'completed') return t('common.status.ready')
  return t('common.status.preparing')
})

// --- Helpers ---
const addLog = (msg) => {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0')
  systemLogs.value.push({ time, msg })
  if (systemLogs.value.length > 100) {
    systemLogs.value.shift()
  }
}

const updateStatus = (status) => {
  currentStatus.value = status
}

// --- Layout Methods ---
const toggleMaximize = (target) => {
  if (viewMode.value === target) {
    viewMode.value = 'split'
  } else {
    viewMode.value = target
  }
}

const handleGoBack = () => {
  // 프로세스 페이지로 돌아가기
  if (projectData.value?.project_id) {
    router.push({ name: 'Process', params: { projectId: projectData.value.project_id } })
  } else {
    router.push('/')
  }
}

const handleNextStep = (params = {}) => {
  addLog('3단계로 이동: 시뮬레이션 시작')

  // 시뮬레이션 라운드 구성 기록
  if (params.maxRounds) {
    addLog(`맞춤형 시뮬레이션 라운드: ${params.maxRounds} 바퀴`)
  } else {
    addLog('자동으로 구성된 시뮬레이션 라운드 수 사용')
  }

  // 라우팅 매개변수 구축
  const routeParams = {
    name: 'SimulationRun',
    params: { simulationId: currentSimulationId.value }
  }

  // 사용자 정의 라운드 수가 있는 경우 쿼리 매개변수를 통해 전달합니다.
  if (params.maxRounds) {
    routeParams.query = { maxRounds: params.maxRounds }
  }

  // 3단계 페이지로 이동
  router.push(routeParams)
}

// --- Data Logic ---

/**
 * 실행 중인 시뮬레이션 확인 및 종료
 * 사용자가 3단계에서 2단계로 돌아올 때 사용자는 기본적으로 시뮬레이션을 종료합니다.
 */
const checkAndStopRunningSimulation = async () => {
  if (!currentSimulationId.value) return

  try {
    // 먼저 시뮬레이션 환경이 살아 있는지 확인하십시오.
    const envStatusRes = await getEnvStatus({ simulation_id: currentSimulationId.value })

    if (envStatusRes.success && envStatusRes.data?.env_alive) {
      addLog('시뮬레이션 환경이 실행 중이고 종료되는 것을 감지했습니다....')

      // 시뮬레이션된 환경을 정상적으로 종료해 보세요.
      try {
        const closeRes = await closeSimulationEnv({
          simulation_id: currentSimulationId.value,
          timeout: 10  // 10초 시간 초과
        })

        if (closeRes.success) {
          addLog('✓ 시뮬레이션 환경이 닫혔습니다.')
        } else {
          addLog(`시뮬레이션 환경을 닫지 못했습니다.: ${closeRes.error || '알 수 없는 오류'}`)
          // 정상 종료에 실패하면 강제로 중지해 보세요.
          await forceStopSimulation()
        }
      } catch (closeErr) {
        addLog(`닫기 시뮬레이션 환경 예외: ${closeErr.message}`)
        // 정상 종료 예외가 발생하면 강제 종료를 시도하십시오.
        await forceStopSimulation()
      }
    } else {
      // 환경이 실행되고 있지 않지만 프로세스가 여전히 있을 수 있습니다. 시뮬레이션 상태를 확인하세요.
      const simRes = await getSimulation(currentSimulationId.value)
      if (simRes.success && simRes.data?.status === 'running') {
        addLog('감지된 시뮬레이션 상태는 실행 중 및 중지 중입니다....')
        await forceStopSimulation()
      }
    }
  } catch (err) {
    // 환경 상태를 확인하지 않아도 후속 프로세스에 영향을 미치지 않습니다.
    console.warn('시뮬레이션 상태 확인 실패:', err)
  }
}

/**
 * 시뮬레이션 강제 종료
 */
const forceStopSimulation = async () => {
  try {
    const stopRes = await stopSimulation({ simulation_id: currentSimulationId.value })
    if (stopRes.success) {
      addLog('✓ 시뮬레이션이 강제로 중지되었습니다.')
    } else {
      addLog(`시뮬레이션 강제 중지 실패: ${stopRes.error || '알 수 없는 오류'}`)
    }
  } catch (err) {
    addLog(`강제 중지 시뮬레이션 예외: ${err.message}`)
  }
}

const loadSimulationData = async () => {
  try {
    addLog(`시뮬레이션 데이터 로드: ${currentSimulationId.value}`)

    // 시뮬레이션 정보 얻기
    const simRes = await getSimulation(currentSimulationId.value)
    if (simRes.success && simRes.data) {
      const simData = simRes.data

      // 프로젝트 정보 얻기
      if (simData.project_id) {
        const projRes = await getProject(simData.project_id)
        if (projRes.success && projRes.data) {
          projectData.value = projRes.data
          addLog(`프로젝트가 성공적으로 로드되었습니다.: ${projRes.data.project_id}`)

          // 그래프 데이터 가져오기
          if (projRes.data.graph_id) {
            await loadGraph(projRes.data.graph_id)
          }
        }
      }
    } else {
      addLog(`시뮬레이션 데이터를 로드하지 못했습니다.: ${simRes.error || '알 수 없는 오류'}`)
    }
  } catch (err) {
    addLog(`로딩 예외: ${err.message}`)
  }
}

const loadGraph = async (graphId) => {
  graphLoading.value = true
  try {
    const res = await getGraphData(graphId)
    if (res.success) {
      graphData.value = res.data
      addLog('스펙트럼 데이터가 성공적으로 로드되었습니다.')
    }
  } catch (err) {
    addLog(`지도를 로드하지 못했습니다.: ${err.message}`)
  } finally {
    graphLoading.value = false
  }
}

const refreshGraph = () => {
  if (projectData.value?.graph_id) {
    loadGraph(projectData.value.graph_id)
  }
}

onMounted(async () => {
  addLog('SimulationView 초기화')

  // 실행 중인 시뮬레이션 확인 및 종료(사용자가 3단계에서 돌아올 때)
  await checkAndStopRunningSimulation()

  // 시뮬레이션 데이터 로드
  loadSimulationData()
})
</script>

<style scoped>
.main-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FFF;
  overflow: hidden;
  font-family: 'Space Grotesk', 'Noto Sans KR', system-ui, sans-serif;
}

/* Header */
.app-header {
  height: 60px;
  border-bottom: 1px solid #EAEAEA;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #FFF;
  z-index: 100;
  position: relative;
}

.brand {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 1px;
  cursor: pointer;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.view-switcher {
  display: flex;
  background: #F5F5F5;
  padding: 4px;
  border-radius: 6px;
  gap: 4px;
}

.switch-btn {
  border: none;
  background: transparent;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-btn.active {
  background: #FFF;
  color: #000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.step-num {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: #999;
}

.step-name {
  font-weight: 700;
  color: #000;
}

.step-divider {
  width: 1px;
  height: 14px;
  background-color: #E0E0E0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #CCC;
}

.status-indicator.processing .dot { background: #FF5722; animation: pulse 1s infinite; }
.status-indicator.completed .dot { background: #4CAF50; }
.status-indicator.error .dot { background: #F44336; }

@keyframes pulse { 50% { opacity: 0.5; } }

/* Content */
.content-area {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.panel-wrapper {
  height: 100%;
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease, transform 0.3s ease;
  will-change: width, opacity, transform;
}

.panel-wrapper.left {
  border-right: 1px solid #EAEAEA;
}
</style>
