<template>
  <div class="simulation-panel">

    <div class="control-bar">
      <div class="status-group">

        <div class="platform-status twitter" :class="{ active: runStatus.twitter_running, completed: runStatus.twitter_completed }">
          <div class="platform-header">
            <svg class="platform-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span class="platform-name">{{ t('step3.infoPlaza') }}</span>
            <span v-if="runStatus.twitter_completed" class="status-badge">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </div>
          <div class="platform-stats">
            <span class="stat">
              <span class="stat-label">{{ t('step3.round') }}</span>
              <span class="stat-value mono">{{ runStatus.twitter_current_round || 0 }}<span class="stat-total">/{{ runStatus.total_rounds || maxRounds || '-' }}</span></span>
            </span>
            <span class="stat">
              <span class="stat-label">{{ t('step3.elapsedTime') }}</span>
              <span class="stat-value mono">{{ twitterElapsedTime }}</span>
            </span>
            <span class="stat">
              <span class="stat-label">{{ t('step3.acts') }}</span>
              <span class="stat-value mono">{{ runStatus.twitter_actions_count || 0 }}</span>
            </span>
          </div>

          <div class="actions-tooltip">
            <div class="tooltip-title">{{ t('step3.availableActions') }}</div>
            <div class="tooltip-actions">
              <span class="tooltip-action">{{ t('step3.post') }}</span>
              <span class="tooltip-action">{{ t('step3.like') }}</span>
              <span class="tooltip-action">{{ t('step3.repost') }}</span>
              <span class="tooltip-action">{{ t('step3.quote') }}</span>
              <span class="tooltip-action">{{ t('step3.followAction') }}</span>
              <span class="tooltip-action">{{ t('step3.idle') }}</span>
            </div>
          </div>
        </div>


        <div class="platform-status reddit" :class="{ active: runStatus.reddit_running, completed: runStatus.reddit_completed }">
          <div class="platform-header">
            <svg class="platform-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span class="platform-name">{{ t('step3.topicCommunity') }}</span>
            <span v-if="runStatus.reddit_completed" class="status-badge">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </div>
          <div class="platform-stats">
            <span class="stat">
              <span class="stat-label">{{ t('step3.round') }}</span>
              <span class="stat-value mono">{{ runStatus.reddit_current_round || 0 }}<span class="stat-total">/{{ runStatus.total_rounds || maxRounds || '-' }}</span></span>
            </span>
            <span class="stat">
              <span class="stat-label">{{ t('step3.elapsedTime') }}</span>
              <span class="stat-value mono">{{ redditElapsedTime }}</span>
            </span>
            <span class="stat">
              <span class="stat-label">{{ t('step3.acts') }}</span>
              <span class="stat-value mono">{{ runStatus.reddit_actions_count || 0 }}</span>
            </span>
          </div>

          <div class="actions-tooltip">
            <div class="tooltip-title">{{ t('step3.availableActions') }}</div>
            <div class="tooltip-actions">
              <span class="tooltip-action">{{ t('step3.post') }}</span>
              <span class="tooltip-action">{{ t('step3.comment') }}</span>
              <span class="tooltip-action">{{ t('step3.like') }}</span>
              <span class="tooltip-action">{{ t('step3.dislike') }}</span>
              <span class="tooltip-action">{{ t('step3.search') }}</span>
              <span class="tooltip-action">{{ t('step3.trend') }}</span>
              <span class="tooltip-action">{{ t('step3.followAction') }}</span>
              <span class="tooltip-action">{{ t('step3.mute') }}</span>
              <span class="tooltip-action">{{ t('step3.refresh') }}</span>
              <span class="tooltip-action">{{ t('step3.idle') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-controls">
        <button
          class="action-btn primary"
          :disabled="phase !== 2 || isGeneratingReport"
          @click="handleNextStep"
        >
          <span v-if="isGeneratingReport" class="loading-spinner-small"></span>
          {{ isGeneratingReport ? t('step3.starting') : t('step3.startReport') }}
          <span v-if="!isGeneratingReport" class="arrow-icon">→</span>
        </button>
      </div>
    </div>


    <div class="main-content-area" ref="scrollContainer">

      <div class="timeline-header" v-if="allActions.length > 0">
        <div class="timeline-stats">
          <span class="total-count">{{ t('step3.totalEvents') }}: <span class="mono">{{ allActions.length }}</span></span>
          <span class="platform-breakdown">
            <span class="breakdown-item twitter">
              <svg class="mini-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              <span class="mono">{{ twitterActionsCount }}</span>
            </span>
            <span class="breakdown-divider">/</span>
            <span class="breakdown-item reddit">
              <svg class="mini-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <span class="mono">{{ redditActionsCount }}</span>
            </span>
          </span>
        </div>
      </div>


      <div class="timeline-feed">
        <div class="timeline-axis"></div>

        <TransitionGroup name="timeline-item">
          <div
            v-for="action in chronologicalActions"
            :key="action._uniqueId || action.id || `${action.timestamp}-${action.agent_id}`"
            class="timeline-item"
            :class="action.platform"
          >
            <div class="timeline-marker">
              <div class="marker-dot"></div>
            </div>

            <div class="timeline-card">
              <div class="card-header">
                <div class="agent-info">
                  <div class="avatar-placeholder">{{ (action.agent_name || 'A')[0] }}</div>
                  <span class="agent-name">{{ action.agent_name }}</span>
                </div>

                <div class="header-meta">
                  <div class="platform-indicator">
                    <svg v-if="action.platform === 'twitter'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  </div>
                  <div class="action-badge" :class="getActionTypeClass(action.action_type)">
                    {{ getActionTypeLabel(action.action_type) }}
                  </div>
                </div>
              </div>

              <div class="card-body">

                <div v-if="action.action_type === 'CREATE_POST' && action.action_args?.content" class="content-text main-text">
                  {{ action.action_args.content }}
                </div>


                <template v-if="action.action_type === 'QUOTE_POST'">
                  <div v-if="action.action_args?.quote_content" class="content-text">
                    {{ action.action_args.quote_content }}
                  </div>
                  <div v-if="action.action_args?.original_content" class="quoted-block">
                    <div class="quote-header">
                      <svg class="icon-small" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      <span class="quote-label">@{{ action.action_args.original_author_name || 'User' }}</span>
                    </div>
                    <div class="quote-text">
                      {{ truncateContent(action.action_args.original_content, 150) }}
                    </div>
                  </div>
                </template>


                <template v-if="action.action_type === 'REPOST'">
                  <div class="repost-info">
                    <svg class="icon-small" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                    <span class="repost-label">{{ t('step3.repostedFrom') }} @{{ action.action_args?.original_author_name || 'User' }}</span>
                  </div>
                  <div v-if="action.action_args?.original_content" class="repost-content">
                    {{ truncateContent(action.action_args.original_content, 200) }}
                  </div>
                </template>


                <template v-if="action.action_type === 'LIKE_POST'">
                  <div class="like-info">
                    <svg class="icon-small filled" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span class="like-label">{{ t('step3.likedPost') }} @{{ action.action_args?.post_author_name || 'User' }}</span>
                  </div>
                  <div v-if="action.action_args?.post_content" class="liked-content">
                    "{{ truncateContent(action.action_args.post_content, 120) }}"
                  </div>
                </template>


                <template v-if="action.action_type === 'CREATE_COMMENT'">
                  <div v-if="action.action_args?.content" class="content-text">
                    {{ action.action_args.content }}
                  </div>
                  <div v-if="action.action_args?.post_id" class="comment-context">
                    <svg class="icon-small" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span>{{ t('step3.replyToPost') }} #{{ action.action_args.post_id }}</span>
                  </div>
                </template>


                <template v-if="action.action_type === 'SEARCH_POSTS'">
                  <div class="search-info">
                    <svg class="icon-small" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span class="search-label">{{ t('step3.searchQuery') }}:</span>
                    <span class="search-query">"{{ action.action_args?.query || '' }}"</span>
                  </div>
                </template>


                <template v-if="action.action_type === 'FOLLOW'">
                  <div class="follow-info">
                    <svg class="icon-small" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    <span class="follow-label">{{ t('step3.followed') }} @{{ action.action_args?.target_user || action.action_args?.user_id || 'User' }}</span>
                  </div>
                </template>


                <template v-if="action.action_type === 'UPVOTE_POST' || action.action_type === 'DOWNVOTE_POST'">
                  <div class="vote-info">
                    <svg v-if="action.action_type === 'UPVOTE_POST'" class="icon-small" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    <svg v-else class="icon-small" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    <span class="vote-label">{{ action.action_type === 'UPVOTE_POST' ? t('step3.upvotedPost') : t('step3.downvotedPost') }}</span>
                  </div>
                  <div v-if="action.action_args?.post_content" class="voted-content">
                    "{{ truncateContent(action.action_args.post_content, 120) }}"
                  </div>
                </template>


                <template v-if="action.action_type === 'DO_NOTHING'">
                  <div class="idle-info">
                    <svg class="icon-small" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span class="idle-label">{{ t('step3.actionSkipped') }}</span>
                  </div>
                </template>


                <div v-if="!['CREATE_POST', 'QUOTE_POST', 'REPOST', 'LIKE_POST', 'CREATE_COMMENT', 'SEARCH_POSTS', 'FOLLOW', 'UPVOTE_POST', 'DOWNVOTE_POST', 'DO_NOTHING'].includes(action.action_type) && action.action_args?.content" class="content-text">
                  {{ action.action_args.content }}
                </div>
              </div>

              <div class="card-footer">
                <span class="time-tag">R{{ action.round_num }} • {{ formatActionTime(action.timestamp) }}</span>

              </div>
            </div>
          </div>
        </TransitionGroup>

        <div v-if="allActions.length === 0" class="waiting-state">
          <div class="pulse-ring"></div>
          <span>{{ t('step3.waitingActions') }}</span>
        </div>
      </div>
    </div>


    <div class="system-logs">
      <div class="log-header">
        <span class="log-title">{{ t('common.label.simulationMonitor') }}</span>
        <span class="log-id">{{ simulationId || t('common.label.noSimulation') }}</span>
      </div>
      <div class="log-content" ref="logContent">
        <div class="log-line" v-for="(log, idx) in systemLogs" :key="idx">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-msg">{{ rt(log.msg) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  startSimulation,
  stopSimulation,
  getRunStatus,
  getRunStatusDetail
} from '../api/simulation'
import { generateReport } from '../api/report'
import { useLocale } from '../i18n'

const props = defineProps({
  simulationId: String,
  maxRounds: Number, // Step2에서 전달된 최대 라운드 수
  minutesPerRound: {
    type: Number,
    default: 30 // 기본값은 라운드당 30분입니다.
  },
  projectData: Object,
  graphData: Object,
  systemLogs: Array
})

const emit = defineEmits(['go-back', 'next-step', 'add-log', 'update-status'])
const { t, rt, locale } = useLocale()

const router = useRouter()

// State
const isGeneratingReport = ref(false)
const phase = ref(0) // 0: 시작되지 않음, 1: 달리기, 2: 완전한
const isStarting = ref(false)
const isStopping = ref(false)
const startError = ref(null)
const runStatus = ref({})
const allActions = ref([]) // 모든 작업(증분 누적)
const actionIds = ref(new Set()) // 중복 제거에 사용되는 작업 ID 수집
const scrollContainer = ref(null)

// Computed
// 작업을 시간순으로 표시합니다(최신 항목이 맨 아래, 즉 맨 아래에 표시됨).
const chronologicalActions = computed(() => {
  return allActions.value
})

// 플랫폼별 액션 횟수
const twitterActionsCount = computed(() => {
  return allActions.value.filter(a => a.platform === 'twitter').length
})

const redditActionsCount = computed(() => {
  return allActions.value.filter(a => a.platform === 'reddit').length
})

// 형식 시뮬레이션 경과 시간(라운드 및 라운드당 분으로 계산)
const formatElapsedTime = (currentRound) => {
  if (!currentRound || currentRound <= 0) {
    return locale.value === 'ko' ? '0시간 0분' : '0h 0m'
  }
  const totalMinutes = currentRound * props.minutesPerRound
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return locale.value === 'ko' ? `${hours}시간 ${minutes}분` : `${hours}h ${minutes}m`
}

// Twitter플랫폼의 시뮬레이션된 경과 시간
const twitterElapsedTime = computed(() => {
  return formatElapsedTime(runStatus.value.twitter_current_round || 0)
})

// Reddit플랫폼의 시뮬레이션된 경과 시간
const redditElapsedTime = computed(() => {
  return formatElapsedTime(runStatus.value.reddit_current_round || 0)
})

// Methods
const addLog = (msg) => {
  emit('add-log', msg)
}

// 모든 상태 재설정(시뮬레이션 재시작용)
const resetAllState = () => {
  phase.value = 0
  runStatus.value = {}
  allActions.value = []
  actionIds.value = new Set()
  prevTwitterRound.value = 0
  prevRedditRound.value = 0
  startError.value = null
  isStarting.value = false
  isStopping.value = false
  stopPolling()  // 이전에 존재했을 수 있는 폴링 중지
}

// 시뮬레이션 시작
const doStartSimulation = async () => {
  if (!props.simulationId) {
    addLog('오류: 시뮬레이션 ID가 누락되었습니다.')
    return
  }

  // 마지막 시뮬레이션의 영향을 받지 않도록 모든 상태를 먼저 재설정하세요.
  resetAllState()

  isStarting.value = true
  startError.value = null
  addLog('듀얼 플랫폼 병렬 시뮬레이션 시작...')
  emit('update-status', 'processing')

  try {
    const params = {
      simulation_id: props.simulationId,
      platform: 'parallel',
      force: true,  // 강제 재시작
      enable_graph_memory_update: true  // 동적 지도 업데이트 활성화
    }

    if (props.maxRounds) {
      params.max_rounds = props.maxRounds
      addLog(`최대 시뮬레이션 라운드 수 설정: ${props.maxRounds}`)
    }

    addLog('동적 지도 업데이트 모드가 켜졌습니다.')

    const res = await startSimulation(params)

    if (res.success && res.data) {
      if (res.data.force_restarted) {
        addLog('✓ 오래된 시뮬레이션 로그를 정리하고 시뮬레이션을 다시 시작했습니다.')
      }
      addLog('✓ 시뮬레이션 엔진이 성공적으로 시작되었습니다.')
      addLog(`  ├─ PID: ${res.data.process_pid || '-'}`)

      phase.value = 1
      runStatus.value = res.data

      startStatusPolling()
      startDetailPolling()
    } else {
      startError.value = res.error || '시작 실패'
      addLog(`✗ 시작 실패: ${res.error || '알 수 없는 오류'}`)
      emit('update-status', 'error')
    }
  } catch (err) {
    startError.value = err.message
    addLog(`✗ 시작 예외: ${err.message}`)
    emit('update-status', 'error')
  } finally {
    isStarting.value = false
  }
}

// 시뮬레이션 중지
const handleStopSimulation = async () => {
  if (!props.simulationId) return

  isStopping.value = true
  addLog('시뮬레이션 중지...')

  try {
    const res = await stopSimulation({ simulation_id: props.simulationId })

    if (res.success) {
      addLog('✓ 시뮬레이션이 중지되었습니다')
      phase.value = 2
      stopPolling()
      emit('update-status', 'completed')
    } else {
      addLog(`중지 실패: ${res.error || '알 수 없는 오류'}`)
    }
  } catch (err) {
    addLog(`예외 중지: ${err.message}`)
  } finally {
    isStopping.value = false
  }
}

// 폴링 상태
let statusTimer = null
let detailTimer = null

const startStatusPolling = () => {
  statusTimer = setInterval(fetchRunStatus, 2000)
}

const startDetailPolling = () => {
  detailTimer = setInterval(fetchRunStatusDetail, 3000)
}

const stopPolling = () => {
  if (statusTimer) {
    clearInterval(statusTimer)
    statusTimer = null
  }
  if (detailTimer) {
    clearInterval(detailTimer)
    detailTimer = null
  }
}

// 각 플랫폼의 마지막 라운드를 추적하여 변경 사항을 감지하고 로그를 출력합니다.
const prevTwitterRound = ref(0)
const prevRedditRound = ref(0)

const fetchRunStatus = async () => {
  if (!props.simulationId) return

  try {
    const res = await getRunStatus(props.simulationId)

    if (res.success && res.data) {
      const data = res.data

      runStatus.value = data

      // 플랫폼별 라운드 변화를 개별적으로 감지하여 로그 출력
      if (data.twitter_current_round > prevTwitterRound.value) {
        addLog(`[Plaza] R${data.twitter_current_round}/${data.total_rounds} | T:${data.twitter_simulated_hours || 0}h | A:${data.twitter_actions_count}`)
        prevTwitterRound.value = data.twitter_current_round
      }

      if (data.reddit_current_round > prevRedditRound.value) {
        addLog(`[Community] R${data.reddit_current_round}/${data.total_rounds} | T:${data.reddit_simulated_hours || 0}h | A:${data.reddit_actions_count}`)
        prevRedditRound.value = data.reddit_current_round
      }

      // 시뮬레이션이 완료되었는지 감지합니다(러너를 통해)._status 또는 플랫폼이 상태 판단을 완료합니다)
      const isCompleted = data.runner_status === 'completed' || data.runner_status === 'stopped'

      // 추가 확인: 백엔드에 실행기를 업데이트할 시간이 없는 경우_status，하지만 플랫폼이 완료를 보고했습니다.
      // 트위터를 감지하여_completed 그리고 레딧_completed 상태 판단
      const platformsCompleted = checkPlatformsCompleted(data)

      if (isCompleted || platformsCompleted) {
        if (platformsCompleted && !isCompleted) {
          addLog('✓ 모든 플랫폼 시뮬레이션이 종료된 것을 감지했습니다.')
        }
        addLog('✓ 시뮬레이션 완료')
        phase.value = 2
        stopPolling()
        emit('update-status', 'completed')
      }
    }
  } catch (err) {
    console.warn('실행 상태를 가져오지 못했습니다.:', err)
  }
}

// 활성화된 모든 플랫폼이 완료되었는지 확인하세요.
const checkPlatformsCompleted = (data) => {
  // 플랫폼 데이터가 없으면 false를 반환합니다.
  if (!data) return false

  // 플랫폼별 완료상태 확인
  const twitterCompleted = data.twitter_completed === true
  const redditCompleted = data.reddit_completed === true

  // 하나 이상의 플랫폼이 완료되면 활성화된 모든 플랫폼이 완료되었는지 확인하세요.
  // 행동으로_count 플랫폼이 활성화되어 있는지 확인합니다(개수인 경우 > 0 또는 달리기가 사실이었습니다)
  const twitterEnabled = (data.twitter_actions_count > 0) || data.twitter_running || twitterCompleted
  const redditEnabled = (data.reddit_actions_count > 0) || data.reddit_running || redditCompleted

  // 활성화된 플랫폼이 없으면 false를 반환합니다.
  if (!twitterEnabled && !redditEnabled) return false

  // 활성화된 모든 플랫폼이 완료되었는지 확인하세요.
  if (twitterEnabled && !twitterCompleted) return false
  if (redditEnabled && !redditCompleted) return false

  return true
}

const fetchRunStatusDetail = async () => {
  if (!props.simulationId) return

  try {
    const res = await getRunStatusDetail(props.simulationId)

    if (res.success && res.data) {
      // 모두 사용_actions 전체 작업 목록 보기
      const serverActions = res.data.all_actions || []

      // 점진적으로 새 작업 추가(중복 제거)
      let newActionsAdded = 0
      serverActions.forEach(action => {
        // 고유 ID 생성
        const actionId = action.id || `${action.timestamp}-${action.platform}-${action.agent_id}-${action.action_type}`

        if (!actionIds.value.has(actionId)) {
          actionIds.value.add(actionId)
          allActions.value.push({
            ...action,
            _uniqueId: actionId
          })
          newActionsAdded++
        }
      })

      // 자동 스크롤이 없어 사용자가 자유롭게 타임라인을 볼 수 있습니다.
      // 하단에 새로운 액션이 추가됩니다
    }
  } catch (err) {
    console.warn('자세한 상태를 가져오지 못했습니다.:', err)
  }
}

// Helpers
const getActionTypeLabel = (type) => {
  const labels = {
    'CREATE_POST': t('step3.post'),
    'REPOST': t('step3.repost'),
    'LIKE_POST': t('step3.like'),
    'CREATE_COMMENT': t('step3.comment'),
    'LIKE_COMMENT': t('step3.like'),
    'DO_NOTHING': t('step3.idle'),
    'FOLLOW': t('step3.followAction'),
    'SEARCH_POSTS': t('step3.search'),
    'QUOTE_POST': t('step3.quote'),
    'UPVOTE_POST': t('step3.upvote'),
    'DOWNVOTE_POST': t('step3.downvote')
  }
  return labels[type] || type || 'UNKNOWN'
}

const getActionTypeClass = (type) => {
  const classes = {
    'CREATE_POST': 'badge-post',
    'REPOST': 'badge-action',
    'LIKE_POST': 'badge-action',
    'CREATE_COMMENT': 'badge-comment',
    'LIKE_COMMENT': 'badge-action',
    'QUOTE_POST': 'badge-post',
    'FOLLOW': 'badge-meta',
    'SEARCH_POSTS': 'badge-meta',
    'UPVOTE_POST': 'badge-action',
    'DOWNVOTE_POST': 'badge-action',
    'DO_NOTHING': 'badge-idle'
  }
  return classes[type] || 'badge-default'
}

const truncateContent = (content, maxLength = 100) => {
  if (!content) return ''
  if (content.length > maxLength) return content.substring(0, maxLength) + '...'
  return content
}

const formatActionTime = (timestamp) => {
  if (!timestamp) return ''
  try {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ''
  }
}

const handleNextStep = async () => {
  if (!props.simulationId) {
    addLog('오류: 시뮬레이션 ID가 누락되었습니다.')
    return
  }

  if (isGeneratingReport.value) {
    addLog('보고서 생성 요청이 전송되었습니다. 잠시 기다려 주세요....')
    return
  }

  isGeneratingReport.value = true
  addLog('보고서 생성 시작...')

  try {
    const res = await generateReport({
      simulation_id: props.simulationId,
      force_regenerate: true
    })

    if (res.success && res.data) {
      const reportId = res.data.report_id
      addLog(`✓ 보고서 생성 작업이 시작되었습니다.: ${reportId}`)

      // 보고서 페이지로 이동
      router.push({ name: 'Report', params: { reportId } })
    } else {
      addLog(`✗ 보고서 생성을 시작하지 못했습니다.: ${res.error || '알 수 없는 오류'}`)
      isGeneratingReport.value = false
    }
  } catch (err) {
    addLog(`✗ 보고서 생성 예외 시작: ${err.message}`)
    isGeneratingReport.value = false
  }
}

// Scroll log to bottom
const logContent = ref(null)
watch(() => props.systemLogs?.length, () => {
  nextTick(() => {
    if (logContent.value) {
      logContent.value.scrollTop = logContent.value.scrollHeight
    }
  })
})

onMounted(() => {
  addLog('Step3 시뮬레이션 실행 초기화')
  if (props.simulationId) {
    doStartSimulation()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.simulation-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  font-family: 'Space Grotesk', 'Noto Sans KR', system-ui, sans-serif;
  overflow: hidden;
}

/* --- Control Bar --- */
.control-bar {
  background: #FFF;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #EAEAEA;
  z-index: 10;
  height: 64px;
}

.status-group {
  display: flex;
  gap: 12px;
}

/* Platform Status Cards */
.platform-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 4px;
  background: #FAFAFA;
  border: 1px solid #EAEAEA;
  opacity: 0.7;
  transition: all 0.3s;
  min-width: 140px;
  position: relative;
  cursor: pointer;
}

.platform-status.active {
  opacity: 1;
  border-color: #333;
  background: #FFF;
}

.platform-status.completed {
  opacity: 1;
  border-color: #1A936F;
  background: #F2FAF6;
}

/* Actions Tooltip */
.actions-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  padding: 10px 14px;
  background: #000;
  color: #FFF;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 100;
  min-width: 180px;
  pointer-events: none;
}

.actions-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #000;
}

.platform-status:hover .actions-tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip-title {
  font-size: 10px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.tooltip-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tooltip-action {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  color: #FFF;
  letter-spacing: 0.03em;
}

.platform-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.platform-name {
  font-size: 11px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.platform-status.twitter .platform-icon { color: #000; }
.platform-status.reddit .platform-icon { color: #000; }

.platform-stats {
  display: flex;
  gap: 10px;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.stat-label {
  font-size: 8px;
  color: #999;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.stat-total, .stat-unit {
  font-size: 9px;
  color: #999;
  font-weight: 400;
}

.status-badge {
  margin-left: auto;
  color: #1A936F;
  display: flex;
  align-items: center;
}

/* Action Button */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.action-btn.primary {
  background: #000;
  color: #FFF;
}

.action-btn.primary:hover:not(:disabled) {
  background: #333;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* --- Main Content Area --- */
.main-content-area {
  flex: 1;
  overflow-y: auto;
  position: relative;
  background: #FFF;
}

/* Timeline Header */
.timeline-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 12px 24px;
  border-bottom: 1px solid #EAEAEA;
  z-index: 5;
  display: flex;
  justify-content: center;
}

.timeline-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: #666;
  background: #F5F5F5;
  padding: 4px 12px;
  border-radius: 20px;
}

.total-count {
  font-weight: 600;
  color: #333;
}

.platform-breakdown {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breakdown-divider { color: #DDD; }
.breakdown-item.twitter { color: #000; }
.breakdown-item.reddit { color: #000; }

/* --- Timeline Feed --- */
.timeline-feed {
  padding: 24px 0;
  position: relative;
  min-height: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.timeline-axis {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #EAEAEA; /* Cleaner line */
  transform: translateX(-50%);
}

.timeline-item {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  position: relative;
  width: 100%;
}

.timeline-marker {
  position: absolute;
  left: 50%;
  top: 24px;
  width: 10px;
  height: 10px;
  background: #FFF;
  border: 1px solid #CCC;
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-dot {
  width: 4px;
  height: 4px;
  background: #CCC;
  border-radius: 50%;
}

.timeline-item.twitter .marker-dot { background: #000; }
.timeline-item.reddit .marker-dot { background: #000; }
.timeline-item.twitter .timeline-marker { border-color: #000; }
.timeline-item.reddit .timeline-marker { border-color: #000; }

/* Card Layout */
.timeline-card {
  width: calc(100% - 48px);
  background: #FFF;
  border-radius: 2px;
  padding: 16px 20px;
  border: 1px solid #EAEAEA;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  position: relative;
  transition: all 0.2s;
}

.timeline-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-color: #DDD;
}

/* Left side (Twitter) */
.timeline-item.twitter {
  justify-content: flex-start;
  padding-right: 50%;
}
.timeline-item.twitter .timeline-card {
  margin-left: auto;
  margin-right: 32px; /* Gap from axis */
}

/* Right side (Reddit) */
.timeline-item.reddit {
  justify-content: flex-end;
  padding-left: 50%;
}
.timeline-item.reddit .timeline-card {
  margin-right: auto;
  margin-left: 32px; /* Gap from axis */
}

/* Card Content Styles */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F5F5F5;
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-placeholder {
  width: 24px;
  height: 24px;
  background: #000;
  color: #FFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.agent-name {
  font-size: 13px;
  font-weight: 600;
  color: #000;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-indicator {
  color: #999;
  display: flex;
  align-items: center;
}

.action-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 2px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid transparent;
}

/* Monochromatic Badges */
.badge-post { background: #F0F0F0; color: #333; border-color: #E0E0E0; }
.badge-comment { background: #F0F0F0; color: #666; border-color: #E0E0E0; }
.badge-action { background: #FFF; color: #666; border: 1px solid #E0E0E0; }
.badge-meta { background: #FAFAFA; color: #999; border: 1px dashed #DDD; }
.badge-idle { opacity: 0.5; }

.content-text {
  font-size: 13px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 10px;
}

.content-text.main-text {
  font-size: 14px;
  color: #000;
}

/* Info Blocks (Quote, Repost, etc) */
.quoted-block, .repost-content {
  background: #F9F9F9;
  border: 1px solid #EEE;
  padding: 10px 12px;
  border-radius: 2px;
  margin-top: 8px;
  font-size: 12px;
  color: #555;
}

.quote-header, .repost-info, .like-info, .search-info, .follow-info, .vote-info, .idle-info, .comment-context {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #666;
}

.icon-small {
  color: #999;
}
.icon-small.filled {
  color: #999; /* Keep icons neutral unless highlighted */
}

.search-query {
  font-family: 'JetBrains Mono', monospace;
  background: #F0F0F0;
  padding: 0 4px;
  border-radius: 2px;
}

.card-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  font-size: 10px;
  color: #BBB;
  font-family: 'JetBrains Mono', monospace;
}

/* Waiting State */
.waiting-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #CCC;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.pulse-ring {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #EAEAEA;
  animation: ripple 2s infinite;
}

@keyframes ripple {
  0% { transform: scale(0.8); opacity: 1; border-color: #CCC; }
  100% { transform: scale(2.5); opacity: 0; border-color: #EAEAEA; }
}

/* Animation */
.timeline-item-enter-active,
.timeline-item-leave-active {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.timeline-item-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.timeline-item-leave-to {
  opacity: 0;
}

/* Logs */
.system-logs {
  background: #000;
  color: #DDD;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  border-top: 1px solid #222;
  flex-shrink: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
  margin-bottom: 8px;
  font-size: 10px;
  color: #666;
}

.log-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100px;
  overflow-y: auto;
  padding-right: 4px;
}

.log-content::-webkit-scrollbar { width: 4px; }
.log-content::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

.log-line {
  font-size: 11px;
  display: flex;
  gap: 12px;
  line-height: 1.5;
}

.log-time { color: #555; min-width: 75px; }
.log-msg { color: #BBB; word-break: break-all; }
.mono { font-family: 'JetBrains Mono', monospace; }

/* Loading spinner for button */
.loading-spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}
</style>
