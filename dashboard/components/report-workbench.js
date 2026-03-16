import { formatDate } from '@/lib/utils'
import { normalizeConfigReasoning, normalizeDashboardText, translateDashboardIdentifier } from '@/lib/dashboard-text'

function statusLabel(status) {
  switch (status) {
    case 'completed': return '완료'
    case 'processing': return '진행 중'
    case 'failed': return '오류'
    default: return '대기'
  }
}

function StepCard({ step, defaultOpen = false }) {
  const tags = step.tagGroups || []
  const metrics = step.metrics || []
  const bullets = step.bullets || []
  const logLines = step.logLines || []
  const note = normalizeDashboardText(step.note)

  return (
    <details className={`workflow-card status-${step.status || 'pending'}`} open={defaultOpen}>
      <summary className="workflow-summary">
        <div className="workflow-summary-main">
          <div className="workflow-step-pill">{step.number}</div>
          <div>
            <div className="workflow-summary-title">{step.title}</div>
            <div className="workflow-summary-desc">{step.description}</div>
          </div>
        </div>
        <div className="workflow-summary-side">
          <span className={`badge status-${step.status || 'pending'}`}>{statusLabel(step.status)}</span>
          <span className="workflow-toggle">펼치기/접기</span>
        </div>
      </summary>

      <div className="workflow-body">
        {step.api ? <div className="api-note">{step.api}</div> : null}
        {step.summary ? <p className="workflow-summary-copy">{normalizeDashboardText(step.summary)}</p> : null}

        {metrics.length ? (
          <div className="metrics-grid compact">
            {metrics.map((metric) => (
              <div className="metric-card" key={`${step.id}-${metric.label}`}>
                <div className="metric-value small">{translateDashboardIdentifier(metric.value)}</div>
                <div className="metric-label">{metric.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {note ? <div className="notice soft">{note}</div> : null}

        {tags.map((group) => group.tags?.length ? (
          <div className="detail-block" key={`${step.id}-${group.label}`}>
            <div className="detail-title">{group.label}</div>
            <div className="tag-list">
              {group.tags.map((tag) => <span className="tag-chip" key={`${step.id}-${group.label}-${tag}`}>{translateDashboardIdentifier(tag)}</span>)}
            </div>
          </div>
        ) : null)}

        {bullets.length ? (
          <div className="detail-block">
            <div className="detail-title">세부 항목</div>
            <ul className="detail-list">
              {bullets.map((bullet) => <li key={`${step.id}-${bullet}`}>{normalizeDashboardText(bullet)}</li>)}
            </ul>
          </div>
        ) : null}

        {logLines.length ? (
          <div className="detail-block">
            <div className="detail-title">최근 로그</div>
            <pre className="log-box">{logLines.map((line) => normalizeDashboardText(line)).join('\n')}</pre>
          </div>
        ) : null}
      </div>
    </details>
  )
}

export default function ReportWorkbench({ workbench }) {
  if (!workbench) {
    return (
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <div className="panel-kicker">워크벤치</div>
            <h2>워크벤치 정보가 아직 게시되지 않았어.</h2>
          </div>
        </div>
      </section>
    )
  }

  const project = workbench.project || {}
  const simulation = workbench.simulation || {}
  const run = workbench.run || {}
  const report = workbench.report || {}
  const normalizedConfigReasoning = normalizeConfigReasoning(simulation.configReasoning)

  return (
    <section className="panel-card">
      <div className="panel-head split">
        <div>
          <div className="panel-kicker">워크벤치</div>
          <h2>원본 MiroFish와 비슷한 단계형 워크벤치</h2>
          <p className="muted">온톨로지 → GraphRAG → 환경 구성 → 시뮬레이션 실행 → 보고서 생성 전체 흐름을 접었다 펼치며 볼 수 있어.</p>
        </div>
        <div className="meta-list">
          <span className="badge">프로젝트 {project.projectId || '—'}</span>
          <span className="badge">시뮬레이션 {simulation.simulationId || '—'}</span>
          <span className="badge">리포트 {report.reportId || '—'}</span>
          <span className="badge">업데이트 {formatDate(project.updatedAt || run.updated_at || report.progress?.updated_at)}</span>
        </div>
      </div>

      {normalizedConfigReasoning ? <div className="notice soft">{normalizedConfigReasoning}</div> : null}

      <div className="workflow-stack">
        {(workbench.steps || []).map((step, index) => (
          <StepCard key={step.id || step.title || index} step={step} defaultOpen />
        ))}
      </div>
    </section>
  )
}
