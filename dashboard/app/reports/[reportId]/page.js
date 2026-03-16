import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getReport } from '@/lib/store'
import { normalizeDashboardText } from '@/lib/dashboard-text'
import { formatDate } from '@/lib/utils'
import ReportWorkbench from '@/components/report-workbench'
import ReportGraphPanel from '@/components/report-graph-panel'

export const dynamic = 'force-dynamic'

function extractConclusion(markdown, fallbackSummary = '') {
  const text = `${markdown || ''}`
  const lines = text.split(/\r?\n/)
  const lead = lines.find((line) => line.trim().startsWith('> '))
  const bullets = []
  let inSummary = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (/^A\.\s*5줄 요약/.test(line)) {
      inSummary = true
      continue
    }
    if (inSummary && /^B\./.test(line)) break
    if (inSummary && line.startsWith('- ')) {
      bullets.push(normalizeDashboardText(line.replace(/^- /, '')))
    }
  }

  return {
    lead: normalizeDashboardText(lead ? lead.replace(/^>\s*/, '') : fallbackSummary),
    bullets: bullets.slice(0, 5)
  }
}

export default async function ReportPage({ params }) {
  const { reportId } = await params
  const report = await getReport(reportId)

  if (!report) {
    return (
      <main>
        <div className="page-shell">
          <div className="error-box">리포트를 찾을 수 없어.</div>
        </div>
      </main>
    )
  }

  const conclusion = extractConclusion(report.markdown, report.summary)
  const sourceMaterials = report.inputs || { simulationPrompt: '', sourceFiles: [] }

  return (
    <main>
      <div className="page-shell report-page report-page-wide">
        <section className="hero-shell detail-hero">
          <div className="hero-copy">
            <div className="tag-row">
              <span className="orange-tag">공개 리포트</span>
              <span className="version-text">그래프 + 워크벤치 공개</span>
            </div>
            <h1 className="main-title small-title">{normalizeDashboardText(report.title)}</h1>
            <p className="hero-lead">{normalizeDashboardText(report.summary) || '요약 없음'}</p>
            <div className="hero-links">
              <Link href="/" className="btn secondary">← 목록으로</Link>
              {report.requestId ? <Link href={`/requests/${report.requestId}`} className="btn secondary">요청 상태 보기</Link> : null}
            </div>
          </div>

          <div className="hero-side">
            <div className="panel-card translucent compact-panel">
              <div className="metrics-grid compact">
                <div className="metric-card accent">
                  <div className="metric-value small">{report.graph?.nodeCount || '—'}</div>
                  <div className="metric-label">노드</div>
                </div>
                <div className="metric-card accent">
                  <div className="metric-value small">{report.graph?.edgeCount || '—'}</div>
                  <div className="metric-label">엣지</div>
                </div>
                <div className="metric-card accent">
                  <div className="metric-value small">{report.workbench?.steps?.length || '—'}</div>
                  <div className="metric-label">워크벤치 단계</div>
                </div>
                <div className="metric-card accent">
                  <div className="metric-value small">{report.outline?.sections?.length || report.workbench?.report?.sections?.length || '—'}</div>
                  <div className="metric-label">리포트 섹션</div>
                </div>
              </div>
              <div className="meta-list small">
                <span className="badge">리포트 {report.reportId}</span>
                <span className="badge">시뮬레이션 {report.simulationId || '—'}</span>
                <span className="badge">게시 {formatDate(report.publishedAt || report.updatedAt)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head split">
            <div>
              <div className="panel-kicker">입력 단서</div>
              <h2>현실 단서 파일과 시뮬레이션 프롬프트</h2>
              <p className="muted">리포트를 만들 때 최초로 넣었던 현실 단서 파일과 시뮬레이션 프롬프트를 먼저 보여줘.</p>
            </div>
          </div>

          <div className="details-stack">
            <details className="detail-card" open>
              <summary>시뮬레이션 프롬프트</summary>
              <pre className="log-box">{sourceMaterials.simulationPrompt || '기록된 시뮬레이션 프롬프트가 없어.'}</pre>
            </details>

            {(sourceMaterials.sourceFiles || []).map((file, index) => (
              <details className="detail-card" open key={`${file.filename || 'source'}-${index}`}>
                <summary>{file.filename || `현실 단서 파일 ${index + 1}`}</summary>
                <div className="meta-list small">
                  <span className="badge">파일 {index + 1}</span>
                  {typeof file.size === 'number' ? <span className="badge">{file.size.toLocaleString()} 바이트</span> : null}
                </div>
                <div className="markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.content || '_표시할 파일 내용이 없어._'}</ReactMarkdown>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="panel-card report-conclusion-panel">
          <div className="panel-head split">
            <div>
              <div className="panel-kicker">결론</div>
              <h2>리포트 결론</h2>
            </div>
          </div>
          <div className="conclusion-layout">
            <div>
              <p className="conclusion-lead">{conclusion.lead || '결론 요약이 아직 없어.'}</p>
              {conclusion.bullets.length ? (
                <div className="conclusion-card-grid">
                  {conclusion.bullets.map((bullet, index) => (
                    <article className="conclusion-story-card" key={`${index}-${bullet.slice(0, 24)}`}>
                      <span className="conclusion-card-kicker">핵심 포인트 {String(index + 1).padStart(2, '0')}</span>
                      <p>{bullet}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="conclusion-mini-grid">
              <div className="conclusion-mini-card">
                <strong>보고서 상태</strong>
                <span>{report.status === 'completed' ? '완료' : report.status || '완료'}</span>
              </div>
              <div className="conclusion-mini-card">
                <strong>핵심 그래프 규모</strong>
                <span>노드 {report.graph?.nodeCount || 0} · 엣지 {report.graph?.edgeCount || 0}</span>
              </div>
              <div className="conclusion-mini-card">
                <strong>워크벤치 단계</strong>
                <span>{report.workbench?.steps?.length || 0}개 단계가 공개되어 있어.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel-card markdown-panel">
          <div className="panel-head split">
            <div>
              <div className="panel-kicker">보고서</div>
              <h2>전체 예측 보고서</h2>
            </div>
          </div>
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.markdown}</ReactMarkdown>
          </div>
        </section>

        <div className="report-flow-stack">
          <ReportGraphPanel graph={report.graph} />
          <ReportWorkbench workbench={report.workbench} />
        </div>
      </div>
    </main>
  )
}
