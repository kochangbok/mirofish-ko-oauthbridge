<template>
  <div
    class="history-database"
    :class="{ 'no-projects': projects.length === 0 && !loading }"
    ref="historyContainer"
  >

    <div v-if="projects.length > 0 || loading" class="tech-grid-bg">
      <div class="grid-pattern"></div>
      <div class="gradient-overlay"></div>
    </div>


    <div class="section-header">
      <div class="section-line"></div>
      <span class="section-title">{{ t('history.title') }}</span>
      <div class="section-line"></div>
    </div>


    <div v-if="projects.length > 0" class="cards-container" :class="{ expanded: isExpanded }" :style="containerStyle">
      <div
        v-for="(project, index) in projects"
        :key="project.simulation_id"
        class="project-card"
        :class="{ expanded: isExpanded, hovering: hoveringCard === index }"
        :style="getCardStyle(index)"
        @mouseenter="hoveringCard = index"
        @mouseleave="hoveringCard = null"
        @click="navigateToProject(project)"
      >

        <div class="card-header">
          <span class="card-id">{{ formatSimulationId(project.simulation_id) }}</span>
          <div class="card-status-icons">
            <span
              class="status-icon"
              :class="{ available: project.project_id, unavailable: !project.project_id }"
              :title="t('history.graphBuild')"
            >◇</span>
            <span
              class="status-icon available"
              :title="t('history.envSetup')"
            >◈</span>
            <span
              class="status-icon"
              :class="{ available: project.report_id, unavailable: !project.report_id }"
              :title="t('history.report')"
            >◆</span>
          </div>
        </div>


        <div class="card-files-wrapper">

          <div class="corner-mark top-left-only"></div>


          <div class="files-list" v-if="project.files && project.files.length > 0">
            <div
              v-for="(file, fileIndex) in project.files.slice(0, 3)"
              :key="fileIndex"
              class="file-item"
            >
              <span class="file-tag" :class="getFileType(file.filename)">{{ getFileTypeLabel(file.filename) }}</span>
              <span class="file-name">{{ truncateFilename(file.filename, 20) }}</span>
            </div>
            <div v-if="project.files.length > 3" class="files-more">
              +{{ project.files.length - 3 }} {{ t('history.filesSuffix') }}
            </div>
          </div>

          <div class="files-empty" v-else>
            <span class="empty-file-icon">◇</span>
            <span class="empty-file-text">{{ t('common.label.noFile') }}</span>
          </div>
        </div>


        <h3 class="card-title">{{ getSimulationTitle(project.simulation_requirement) }}</h3>


        <p class="card-desc">{{ truncateText(project.simulation_requirement, 55) }}</p>


        <div class="card-footer">
          <div class="card-datetime">
            <span class="card-date">{{ formatDate(project.created_at) }}</span>
            <span class="card-time">{{ formatTime(project.created_at) }}</span>
          </div>
          <span class="card-progress" :class="getProgressClass(project)">
            <span class="status-dot">●</span> {{ formatRounds(project) }}
          </span>
        </div>


        <div class="card-bottom-line"></div>
      </div>
    </div>


    <div v-if="loading" class="loading-state">
      <span class="loading-spinner"></span>
      <span class="loading-text">{{ t('history.loading') }}</span>
    </div>


    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedProject" class="modal-overlay" @click.self="closeModal">
          <div class="modal-content">

            <div class="modal-header">
              <div class="modal-title-section">
                <span class="modal-id">{{ formatSimulationId(selectedProject.simulation_id) }}</span>
                <span class="modal-progress" :class="getProgressClass(selectedProject)">
                  <span class="status-dot">●</span> {{ formatRounds(selectedProject) }}
                </span>
                <span class="modal-create-time">{{ formatDate(selectedProject.created_at) }} {{ formatTime(selectedProject.created_at) }}</span>
              </div>
              <button class="modal-close" @click="closeModal">×</button>
            </div>


            <div class="modal-body">

              <div class="modal-section">
                <div class="modal-label">{{ t('history.requirement') }}</div>
                <div class="modal-requirement">{{ selectedProject.simulation_requirement || '-' }}</div>
              </div>


              <div class="modal-section">
                <div class="modal-label">{{ t('history.linkedFiles') }}</div>
                <div class="modal-files" v-if="selectedProject.files && selectedProject.files.length > 0">
                  <div v-for="(file, index) in selectedProject.files" :key="index" class="modal-file-item">
                    <span class="file-tag" :class="getFileType(file.filename)">{{ getFileTypeLabel(file.filename) }}</span>
                    <span class="modal-file-name">{{ file.filename }}</span>
                  </div>
                </div>
                <div class="modal-empty" v-else>{{ t('common.label.noLinkedFiles') }}</div>
              </div>
            </div>


            <div class="modal-divider">
              <span class="divider-line"></span>
              <span class="divider-text">{{ t('history.playback') }}</span>
              <span class="divider-line"></span>
            </div>


            <div class="modal-actions">
              <button
                class="modal-btn btn-project"
                @click="goToProject"
                :disabled="!selectedProject.project_id"
              >
                <span class="btn-step">Step1</span>
                <span class="btn-icon">◇</span>
                <span class="btn-text">{{ t('history.graphBuild') }}</span>
              </button>
              <button
                class="modal-btn btn-simulation"
                @click="goToSimulation"
              >
                <span class="btn-step">Step2</span>
                <span class="btn-icon">◈</span>
                <span class="btn-text">{{ t('history.envSetup') }}</span>
              </button>
              <button
                class="modal-btn btn-report"
                @click="goToReport"
                :disabled="!selectedProject.report_id"
              >
                <span class="btn-step">Step4</span>
                <span class="btn-icon">◆</span>
                <span class="btn-text">{{ t('history.report') }}</span>
              </button>
            </div>

            <div class="modal-playback-hint">
              <span class="hint-text">{{ t('history.playbackHint') }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getSimulationHistory } from '../api/simulation'
import { useLocale } from '../i18n'

const router = useRouter()
const route = useRoute()
const { t } = useLocale()

// 상태
const projects = ref([])
const loading = ref(true)
const isExpanded = ref(false)
const hoveringCard = ref(null)
const historyContainer = ref(null)
const selectedProject = ref(null)  // 현재 선택된 항목(팝업 창용)
let observer = null
let isAnimating = false  // 깜박임 방지를 위한 애니메이션 잠금
let expandDebounceTimer = null  // 흔들림 방지 타이머
let pendingState = null  // 실행될 대상 상태를 기록합니다.

// 카드 레이아웃 구성 - 더 넓은 비율로 조정됨
const CARDS_PER_ROW = 4
const CARD_WIDTH = 280
const CARD_HEIGHT = 280
const CARD_GAP = 24

// 컨테이너 높이 스타일을 동적으로 계산합니다.
const containerStyle = computed(() => {
  if (!isExpanded.value) {
    // 접힌 상태: 고정 높이
    return { minHeight: '420px' }
  }

  // 확장된 상태: 카드 수에 따라 높이를 동적으로 계산합니다.
  const total = projects.value.length
  if (total === 0) {
    return { minHeight: '280px' }
  }

  const rows = Math.ceil(total / CARDS_PER_ROW)
  // 실제 필요한 높이 계산: 행 수 * 카드 높이 + (줄 수 - 1) * 간격 + 바닥 간격이 적음
  const expandedHeight = rows * CARD_HEIGHT + (rows - 1) * CARD_GAP + 10

  return { minHeight: `${expandedHeight}px` }
})

// 카드 스타일 가져오기
const getCardStyle = (index) => {
  const total = projects.value.length

  if (isExpanded.value) {
    // 확장된 상태: 그리드 레이아웃
    const transition = 'transform 700ms cubic-bezier(0.23, 1, 0.32, 1), opacity 700ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease, border-color 0.3s ease'

    const col = index % CARDS_PER_ROW
    const row = Math.floor(index / CARDS_PER_ROW)

    // 각 행이 중앙에 오도록 현재 행의 카드 수를 계산합니다.
    const currentRowStart = row * CARDS_PER_ROW
    const currentRowCards = Math.min(CARDS_PER_ROW, total - currentRowStart)

    const rowWidth = currentRowCards * CARD_WIDTH + (currentRowCards - 1) * CARD_GAP

    const startX = -(rowWidth / 2) + (CARD_WIDTH / 2)
    const colInRow = index % CARDS_PER_ROW
    const x = startX + colInRow * (CARD_WIDTH + CARD_GAP)

    // 제목과 제목 사이의 공간을 늘리려면 아래쪽으로 확장하세요.
    const y = 20 + row * (CARD_HEIGHT + CARD_GAP)

    return {
      transform: `translate(${x}px, ${y}px) rotate(0deg) scale(1)`,
      zIndex: 100 + index,
      opacity: 1,
      transition: transition
    }
  } else {
    // 접힌 상태: 부채꼴 스태킹
    const transition = 'transform 700ms cubic-bezier(0.23, 1, 0.32, 1), opacity 700ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease, border-color 0.3s ease'

    const centerIndex = (total - 1) / 2
    const offset = index - centerIndex

    const x = offset * 35
    // 제목에 가깝도록 시작 위치를 조정하되 적절한 간격을 유지하세요.
    const y = 25 + Math.abs(offset) * 8
    const r = offset * 3
    const s = 0.95 - Math.abs(offset) * 0.05

    return {
      transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`,
      zIndex: 10 + index,
      opacity: 1,
      transition: transition
    }
  }
}

// 라운드 진행 상황에 따라 스타일 클래스 받기
const getProgressClass = (simulation) => {
  const current = simulation.current_round || 0
  const total = simulation.total_rounds || 0

  if (total === 0 || current === 0) {
    // 시작되지 않음
    return 'not-started'
  } else if (current >= total) {
    // 완전한
    return 'completed'
  } else {
    // 진행 중
    return 'in-progress'
  }
}

// 날짜 형식 지정(날짜 부분만 표시)
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toISOString().slice(0, 10)
  } catch {
    return dateStr?.slice(0, 10) || ''
  }
}

// 포맷 시간(표시된 경우:가리키다)
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return ''
  }
}

// 텍스트 자르기
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

// ~에서시뮬레이션 요구사항제목 생성(처음 20단어 사용)
const getSimulationTitle = (requirement) => {
  if (!requirement) return t('common.label.unnamedSimulation')
  const title = requirement.slice(0, 20)
  return requirement.length > 20 ? title + '...' : title
}

// 포맷 시뮬레이션_id 표시(처음 6자리 잘림)
const formatSimulationId = (simulationId) => {
  if (!simulationId) return 'SIM_UNKNOWN'
  const prefix = simulationId.replace('sim_', '').slice(0, 6)
  return `SIM_${prefix.toUpperCase()}`
}

// 형식화된 라운드 번호 표시(현재 라운드/총 라운드 수)
const formatRounds = (simulation) => {
  const current = simulation.current_round || 0
  const total = simulation.total_rounds || 0
  if (total === 0) return t('history.roundsBeforeStart')
  return `${current}/${total} ${t('history.roundsSuffix')}`
}

// 파일 형식 가져오기(스타일용)
const getFileType = (filename) => {
  if (!filename) return 'other'
  const ext = filename.split('.').pop()?.toLowerCase()
  const typeMap = {
    'pdf': 'pdf',
    'doc': 'doc', 'docx': 'doc',
    'xls': 'xls', 'xlsx': 'xls', 'csv': 'xls',
    'ppt': 'ppt', 'pptx': 'ppt',
    'txt': 'txt', 'md': 'txt', 'json': 'code',
    'jpg': 'img', 'jpeg': 'img', 'png': 'img', 'gif': 'img',
    'zip': 'zip', 'rar': 'zip', '7z': 'zip'
  }
  return typeMap[ext] || 'other'
}

// 파일 형식 레이블 텍스트 가져오기
const getFileTypeLabel = (filename) => {
  if (!filename) return 'FILE'
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'FILE'
}

// 파일 이름 자르기(확장자 유지)
const truncateFilename = (filename, maxLength) => {
  if (!filename) return t('common.label.unknownFile')
  if (filename.length <= maxLength) return filename

  const ext = filename.includes('.') ? '.' + filename.split('.').pop() : ''
  const nameWithoutExt = filename.slice(0, filename.length - ext.length)
  const truncatedName = nameWithoutExt.slice(0, maxLength - ext.length - 3) + '...'
  return truncatedName + ext
}

// 프로젝트 세부정보 팝업창 열기
const navigateToProject = (simulation) => {
  selectedProject.value = simulation
}

// 팝업 창 닫기
const closeModal = () => {
  selectedProject.value = null
}

// 다음으로 이동그래프 구축페이지(프로젝트)
const goToProject = () => {
  if (selectedProject.value?.project_id) {
    router.push({
      name: 'Process',
      params: { projectId: selectedProject.value.project_id }
    })
    closeModal()
  }
}

// 환경 구성 페이지로 이동(시뮬레이션)
const goToSimulation = () => {
  if (selectedProject.value?.simulation_id) {
    router.push({
      name: 'Simulation',
      params: { simulationId: selectedProject.value.simulation_id }
    })
    closeModal()
  }
}

// 다음으로 이동분석 보고서페이지(신고)
const goToReport = () => {
  if (selectedProject.value?.report_id) {
    router.push({
      name: 'Report',
      params: { reportId: selectedProject.value.report_id }
    })
    closeModal()
  }
}

// 과거 항목 로드
const loadHistory = async () => {
  try {
    loading.value = true
    const response = await getSimulationHistory(20)
    if (response.success) {
      projects.value = response.data || []
    }
  } catch (error) {
    console.error('기록 항목을 로드하지 못했습니다.:', error)
    projects.value = []
  } finally {
    loading.value = false
  }
}

// IntersectionObserver 초기화
const initObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const shouldExpand = entry.isIntersecting

        // 실행할 대상 상태 업데이트(애니메이션 여부에 관계없이 최신 대상 상태를 기록해야 함)
        pendingState = shouldExpand

        // 이전 흔들림 방지 타이머를 지웁니다(새 스크롤 인텐트가 이전 스크롤 인텐트를 덮어씁니다).
        if (expandDebounceTimer) {
          clearTimeout(expandDebounceTimer)
          expandDebounceTimer = null
        }

        // 애니메이션이 진행중인 경우 애니메이션 종료 후 상태만 기록 및 처리됩니다.
        if (isAnimating) return

        // 대상 상태가 현재 상태와 동일하면 처리가 필요하지 않습니다.
        if (shouldExpand === isExpanded.value) {
          pendingState = null
          return
        }

        // 빠른 깜박임을 방지하기 위해 손떨림 방지 지연 상태 전환을 사용합니다.
        // 펼칠 때 지연 시간(50ms)이 짧아지고 접었을 때 지연 시간(200ms)이 길어져 안정성이 향상됩니다.
        const delay = shouldExpand ? 50 : 200

        expandDebounceTimer = setTimeout(() => {
          // 애니메이션이 발생하는지 확인
          if (isAnimating) return

          // 보류 중인 실행 상태를 여전히 실행해야 하는지 확인합니다(이후 스크롤로 덮어쓰였을 수 있음).
          if (pendingState === null || pendingState === isExpanded.value) return

          // 애니메이션 잠금 설정
          isAnimating = true
          isExpanded.value = pendingState
          pendingState = null

          // 애니메이션이 완료되면 잠금을 해제하고 보류 중인 상태 변경 사항이 있는지 확인하세요.
          setTimeout(() => {
            isAnimating = false

            // 애니메이션 종료 후, 새로운 실행 상태가 있는지 확인
            if (pendingState !== null && pendingState !== isExpanded.value) {
              // 너무 빠른 전환을 피하기 위해 짧은 시간 동안 실행을 지연합니다.
              expandDebounceTimer = setTimeout(() => {
                if (pendingState !== null && pendingState !== isExpanded.value) {
                  isAnimating = true
                  isExpanded.value = pendingState
                  pendingState = null
                  setTimeout(() => {
                    isAnimating = false
                  }, 750)
                }
              }, 100)
            }
          }, 750)
        }, delay)
      })
    },
    {
      // 여러 임계값을 사용하여 더 원활하게 감지
      threshold: [0.4, 0.6, 0.8],
      // rootMargin을 조정하면 뷰포트 하단이 위쪽으로 줄어들고 확장을 트리거하려면 더 많은 스크롤이 필요합니다.
      rootMargin: '0px 0px -150px 0px'
    }
  )

  // 관찰을 시작하다
  if (historyContainer.value) {
    observer.observe(historyContainer.value)
  }
}

// 라우팅 변경 사항을 모니터링하고 홈페이지 복귀 시 데이터를 다시 로드하세요.
watch(() => route.path, (newPath) => {
  if (newPath === '/') {
    loadHistory()
  }
})

onMounted(async () => {
  // 데이터를 로드하기 전에 DOM 렌더링이 완료되었는지 확인하세요.
  await nextTick()
  await loadHistory()

  // 관찰자를 초기화하기 전에 DOM이 렌더링될 때까지 기다립니다.
  setTimeout(() => {
    initObserver()
  }, 100)
})

// 연결 유지를 사용하는 경우 구성 요소가 활성화되면 데이터를 다시 로드합니다.
onActivated(() => {
  loadHistory()
})

onUnmounted(() => {
  // 교차로 관찰자 정리
  if (observer) {
    observer.disconnect()
    observer = null
  }
  // 손떨림 방지 타이머 지우기
  if (expandDebounceTimer) {
    clearTimeout(expandDebounceTimer)
    expandDebounceTimer = null
  }
})
</script>

<style scoped>
/* 컨테이너 */
.history-database {
  position: relative;
  width: 100%;
  min-height: 280px;
  margin-top: 40px;
  padding: 35px 0 40px;
  overflow: visible;
}

/* 항목이 없을 때 단순화된 표시 */
.history-database.no-projects {
  min-height: auto;
  padding: 40px 0 20px;
}

/* 기술 그리드 배경 */
.tech-grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

/* CSS 배경 패턴을 사용하여 고정된 간격의 사각형 그리드 만들기 */
.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  /* 위치 지정은 왼쪽 상단부터 시작됩니다. 높이가 변경되면 아래쪽만 확장되며 기존 그리드 위치에는 영향을 주지 않습니다. */
  background-position: top left;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    linear-gradient(to right, rgba(255, 255, 255, 0.9) 0%, transparent 15%, transparent 85%, rgba(255, 255, 255, 0.9) 100%),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 0%, transparent 20%, transparent 80%, rgba(255, 255, 255, 0.8) 100%);
  pointer-events: none;
}

/* 제목 영역 */
.section-header {
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  padding: 0 40px;
}

.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
  max-width: 300px;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: #9CA3AF;
  letter-spacing: 3px;
  text-transform: uppercase;
}

/* 카드 용기 */
.cards-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0 40px;
  transition: min-height 700ms cubic-bezier(0.23, 1, 0.32, 1);
  /* min-height JS에 의해 동적으로 계산되며 카드 수에 따라 적응 가능 */
}

/* 프로젝트 카드 */
.project-card {
  position: absolute;
  width: 280px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 0;
  padding: 14px;
  cursor: pointer;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 700ms cubic-bezier(0.23, 1, 0.32, 1), opacity 700ms cubic-bezier(0.23, 1, 0.32, 1);
}

.project-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.4);
  z-index: 1000 !important;
}

.project-card.hovering {
  z-index: 1000 !important;
}

/* 카드 헤더 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F3F4F6;
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-size: 0.7rem;
}

.card-id {
  color: #6B7280;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* 기능 상태 아이콘 세트 */
.card-status-icons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon {
  font-size: 0.75rem;
  transition: all 0.2s ease;
  cursor: default;
}

.status-icon.available {
  opacity: 1;
}

/* 다양한 기능을 위한 색상 */
.status-icon:nth-child(1).available { color: #3B82F6; } /* 그래프 구축 - 파란색 */
.status-icon:nth-child(2).available { color: #F59E0B; } /* 환경 구성 - 오렌지색 */
.status-icon:nth-child(3).available { color: #10B981; } /* 분석 보고서 - 녹색 */

.status-icon.unavailable {
  color: #D1D5DB;
  opacity: 0.5;
}

/* 라운드 진행상황 표시 */
.card-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.5px;
  font-weight: 600;
  font-size: 0.65rem;
}

.status-dot {
  font-size: 0.5rem;
}

/* 진행 상태 색상 */
.card-progress.completed { color: #10B981; }    /* 완료됨 - 녹색 */
.card-progress.in-progress { color: #F59E0B; }  /* 진행 중 - 주황색 */
.card-progress.not-started { color: #9CA3AF; }  /* 시작되지 않음 - 회색 */
.card-status.pending { color: #9CA3AF; }

/* 파일 목록 영역 */
.card-files-wrapper {
  position: relative;
  width: 100%;
  min-height: 48px;
  max-height: 110px;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  border-radius: 4px;
  border: 1px solid #e8eaed;
  overflow: hidden;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 더 많은 파일 팁 */
.files-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: #6B7280;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  letter-spacing: 0.3px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 3px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateX(2px);
  border-color: #e5e7eb;
}

/* 간단한 파일 라벨 스타일 */
.file-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  padding: 0 4px;
  border-radius: 2px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  flex-shrink: 0;
  min-width: 28px;
}

/* 저채도 배색 - Morandi 컬러 시스템 */
.file-tag.pdf { background: #f2e6e6; color: #a65a5a; }
.file-tag.doc { background: #e6eff5; color: #5a7ea6; }
.file-tag.xls { background: #e6f2e8; color: #5aa668; }
.file-tag.ppt { background: #f5efe6; color: #a6815a; }
.file-tag.txt { background: #f0f0f0; color: #757575; }
.file-tag.code { background: #eae6f2; color: #815aa6; }
.file-tag.img { background: #e6f2f2; color: #5aa6a6; }
.file-tag.zip { background: #f2f0e6; color: #a69b5a; }
.file-tag.other { background: #f3f4f6; color: #6b7280; }

.file-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.1px;
}

/* 파일이 없을 때 자리표시자 */
.files-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  color: #9CA3AF;
}

.empty-file-icon {
  font-size: 1rem;
  opacity: 0.5;
}

.empty-file-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

/* 마우스 오버 시 파일 영역 효과 */
.project-card:hover .card-files-wrapper {
  border-color: #d1d5db;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

/* 코너 장식 */
.corner-mark.top-left-only {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 8px;
  height: 8px;
  border-top: 1.5px solid rgba(0, 0, 0, 0.4);
  border-left: 1.5px solid rgba(0, 0, 0, 0.4);
  pointer-events: none;
  z-index: 10;
}

/* 카드 제목 */
.card-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.project-card:hover .card-title {
  color: #2563EB;
}

/* 카드 설명 */
.card-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #6B7280;
  margin: 0 0 16px 0;
  line-height: 1.5;
  height: 34px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 카드 바닥 */
.card-footer {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: #9CA3AF;
  font-weight: 500;
}

/* 날짜 시간 조합 */
.card-datetime {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 하단 라운드 진행 표시 */
.card-footer .card-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.5px;
  font-weight: 600;
  font-size: 0.65rem;
}

.card-footer .status-dot {
  font-size: 0.5rem;
}

/* 진행 상태 색상 - 하단 */
.card-footer .card-progress.completed { color: #10B981; }
.card-footer .card-progress.in-progress { color: #F59E0B; }
.card-footer .card-progress.not-started { color: #9CA3AF; }

/* 하단 장식선 */
.card-bottom-line {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0;
  background-color: #000;
  transition: width 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 20;
}

.project-card:hover .card-bottom-line {
  width: 100%;
}

/* 빈 상태 */
.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 48px;
  color: #9CA3AF;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #E5E7EB;
  border-top-color: #6B7280;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 반응형 */
@media (max-width: 1200px) {
  .project-card {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .cards-container {
    padding: 0 20px;
  }
  .project-card {
    width: 200px;
  }
}

/* ===== 기록 재생 세부 정보 팝업 창 스타일 ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #FFFFFF;
  width: 560px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* 애니메이션 전환 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active .modal-content {
  transition: all 0.2s ease-in;
}

.modal-enter-from .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

/* 팝업 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid #F3F4F6;
  background: #FFFFFF;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: 0.5px;
}

.modal-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background: #F9FAFB;
}

.modal-progress.completed { color: #10B981; background: rgba(16, 185, 129, 0.1); }
.modal-progress.in-progress { color: #F59E0B; background: rgba(245, 158, 11, 0.1); }
.modal-progress.not-started { color: #9CA3AF; background: #F3F4F6; }

.modal-create-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #9CA3AF;
  letter-spacing: 0.3px;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  color: #9CA3AF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 6px;
}

.modal-close:hover {
  background: #F3F4F6;
  color: #111827;
}

/* 팝업 콘텐츠 */
.modal-body {
  padding: 24px 32px;
}

.modal-section {
  margin-bottom: 24px;
}

.modal-section:last-child {
  margin-bottom: 0;
}

.modal-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
  font-weight: 500;
}

.modal-requirement {
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.6;
  padding: 16px;
  background: #F9FAFB;
  border: 1px solid #F3F4F6;
  border-radius: 8px;
}

.modal-files {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 사용자 정의 스크롤 막대 스타일 */
.modal-files::-webkit-scrollbar {
  width: 4px;
}

.modal-files::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 2px;
}

.modal-files::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 2px;
}

.modal-files::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

.modal-file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-file-item:hover {
  border-color: #D1D5DB;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.modal-file-name {
  font-size: 0.85rem;
  color: #4B5563;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-empty {
  font-size: 0.85rem;
  color: #9CA3AF;
  padding: 16px;
  background: #F9FAFB;
  border: 1px dashed #E5E7EB;
  border-radius: 6px;
  text-align: center;
}

/* 기록 재생구분선 */
.modal-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 32px 0;
  background: #FFFFFF;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
}

.divider-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: #9CA3AF;
  letter-spacing: 2px;
  text-transform: uppercase;
  white-space: nowrap;
}

/* 탐색 버튼 */
.modal-actions {
  display: flex;
  gap: 16px;
  padding: 20px 32px;
  background: #FFFFFF;
}

.modal-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.modal-btn:hover:not(:disabled) {
  border-color: #000000;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #F9FAFB;
}

.btn-step {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  font-weight: 500;
  color: #9CA3AF;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.btn-icon {
  font-size: 1.4rem;
  line-height: 1;
  transition: color 0.2s ease;
}

.btn-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #4B5563;
}

.modal-btn.btn-project .btn-icon { color: #3B82F6; }
.modal-btn.btn-simulation .btn-icon { color: #F59E0B; }
.modal-btn.btn-report .btn-icon { color: #10B981; }

.modal-btn:hover:not(:disabled) .btn-text {
  color: #111827;
}

/* 재생할 수 없음 프롬프트 */
.modal-playback-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px 20px;
  background: #FFFFFF;
}

.hint-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: #9CA3AF;
  letter-spacing: 0.3px;
  text-align: center;
  line-height: 1.5;
}
</style>
