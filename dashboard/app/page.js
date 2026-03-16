import Link from 'next/link'
import { getReportIndex, getRequestIndex } from '@/lib/store'
import { normalizeDashboardText } from '@/lib/dashboard-text'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }) {
  return <span className={`badge status-${status}`}>{status}</span>
}

export default async function HomePage() {
  const [reports, requests] = await Promise.all([getReportIndex(), getRequestIndex()])
  const totalNodes = reports.items.reduce((sum, item) => sum + (item.nodeCount || 0), 0)
  const totalEdges = reports.items.reduce((sum, item) => sum + (item.edgeCount || 0), 0)

  return (
    <main>
      <div className="page-shell dashboard-page">
        <section className="hero-shell">
          <div className="hero-copy">
            <div className="tag-row">
              <span className="orange-tag">PUBLIC WORKBENCH</span>
              <span className="version-text">Vercel · GitHub-backed</span>
            </div>
            <h1 className="main-title">
              누구나 보는 <br />
              <span className="gradient-text">MiroFish 공개 대시보드</span>
            </h1>
            <p className="hero-lead">
              생성된 리포트, GraphRAG 결과, 그리고 원본 MiroFish 스타일의 워크벤치 단계를 누구나 읽을 수 있게 공개해.
              실제 시뮬레이션 실행과 게시 요청 등록은 관리자 화면에서만 가능해.
            </p>
            <div className="hero-links">
              <Link href="/simulationadmin" className="btn primary">관리자 제출 페이지</Link>
              <a href="https://github.com/kochangbok/mirofish-ko-oauthbridge" target="_blank" rel="noreferrer" className="btn secondary">GitHub 저장소 ↗</a>
            </div>
          </div>

          <div className="hero-side">
            <div className="panel-card translucent">
              <div className="panel-head compact">
                <div>
                  <div className="panel-kicker">SYSTEM STATUS</div>
                  <h2>공개 데이터 허브 준비 완료</h2>
                </div>
              </div>
              <div className="metrics-grid">
                <div className="metric-card accent">
                  <div className="metric-value">{reports.items.length}</div>
                  <div className="metric-label">공개 리포트</div>
                </div>
                <div className="metric-card accent">
                  <div className="metric-value">{requests.items.length}</div>
                  <div className="metric-label">공개 요청</div>
                </div>
                <div className="metric-card accent">
                  <div className="metric-value">{totalNodes}</div>
                  <div className="metric-label">누적 노드</div>
                </div>
                <div className="metric-card accent">
                  <div className="metric-value">{totalEdges}</div>
                  <div className="metric-label">누적 엣지</div>
                </div>
              </div>
              <div className="workflow-mini-list">
                <div className="workflow-mini-item"><span>01</span><p>온톨로지 생성</p></div>
                <div className="workflow-mini-item"><span>02</span><p>GraphRAG 구축</p></div>
                <div className="workflow-mini-item"><span>03</span><p>환경 구성</p></div>
                <div className="workflow-mini-item"><span>04</span><p>시뮬레이션 실행</p></div>
                <div className="workflow-mini-item"><span>05</span><p>예측 보고서 생성</p></div>
              </div>
            </div>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel-card">
            <div className="panel-head split">
              <div>
                <div className="panel-kicker">PUBLIC REPORTS</div>
                <h2>생성 완료된 리포트</h2>
                <p className="muted">리포트 상세 페이지에서는 graph와 워크벤치 step을 접었다 펼치며 모두 볼 수 있어.</p>
              </div>
            </div>

            <div className="card-list">
              {reports.items.length ? reports.items.map((report) => (
                <Link key={report.reportId} href={`/reports/${report.reportId}`} className="card-link">
                  <article className="report-card">
                    <div className="card-topline">
                      <StatusBadge status={report.status} />
                      <span className="mono">report {report.reportId}</span>
                    </div>
                    <h3>{normalizeDashboardText(report.title)}</h3>
                    <p>{normalizeDashboardText(report.summary) || '요약 없음'}</p>
                    <div className="meta-list small">
                      <span className="badge">simulation {report.simulationId || '—'}</span>
                      <span className="badge">graph {report.graphId || '—'}</span>
                      <span className="badge">노드 {report.nodeCount || '—'}</span>
                      <span className="badge">엣지 {report.edgeCount || '—'}</span>
                      <span className="badge">게시 {formatDate(report.publishedAt || report.updatedAt)}</span>
                    </div>
                  </article>
                </Link>
              )) : <div className="panel-empty">아직 게시된 리포트가 없어.</div>}
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-head split">
              <div>
                <div className="panel-kicker">PUBLIC QUEUE</div>
                <h2>공개 요청 큐</h2>
                <p className="muted">관리자 화면에서 올린 요청은 누구나 상태를 확인할 수 있어.</p>
              </div>
            </div>

            <div className="card-list">
              {requests.items.length ? requests.items.map((request) => (
                <Link key={request.id} href={`/requests/${request.id}`} className="card-link">
                  <article className="report-card compact-card">
                    <div className="card-topline">
                      <StatusBadge status={request.status} />
                      <span className="mono">request {request.id}</span>
                    </div>
                    <h3>{request.projectName || request.id}</h3>
                    <p>{normalizeDashboardText(request.promptExcerpt)}</p>
                    <div className="meta-list small">
                      <span className="badge">파일 {request.fileCount}개</span>
                      <span className="badge">업데이트 {formatDate(request.updatedAt || request.createdAt)}</span>
                      {request.reportId ? <span className="badge">report {request.reportId}</span> : null}
                    </div>
                  </article>
                </Link>
              )) : <div className="panel-empty">아직 공개 요청이 없어.</div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
