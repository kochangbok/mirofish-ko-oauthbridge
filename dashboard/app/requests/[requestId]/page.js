import Link from 'next/link'
import { getRequest } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import RequestProgressPanel from '@/components/request-progress-panel'

export const dynamic = 'force-dynamic'

export default async function RequestPage({ params }) {
  const { requestId } = await params
  const request = await getRequest(requestId)

  if (!request) {
    return (
      <main>
        <div className="page-shell">
          <div className="error-box">요청을 찾을 수 없어.</div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="page-shell report-page">
        <section className="hero-shell detail-hero">
          <div className="hero-copy">
            <div className="tag-row">
              <span className="orange-tag">PUBLIC REQUEST</span>
              <span className="version-text">누구나 상태 조회 가능</span>
            </div>
            <h1 className="main-title small-title">{request.projectName}</h1>
            <p className="hero-lead">{request.prompt}</p>
            <div className="hero-links">
              <Link href="/" className="btn secondary">← 목록으로</Link>
              {request.reportId ? <Link href={`/reports/${request.reportId}`} className="btn primary">완성된 리포트 보기</Link> : null}
            </div>
          </div>

          <div className="hero-side">
            <div className="panel-card translucent compact-panel">
              <div className="meta-list">
                <span className={`badge status-${request.status}`}>{request.status}</span>
                <span className="badge">request {request.id}</span>
                <span className="badge">생성 {formatDate(request.createdAt)}</span>
                <span className="badge">업데이트 {formatDate(request.updatedAt)}</span>
              </div>
              {request.error ? <div className="error-box">{request.error}</div> : null}
            </div>
          </div>
        </section>

        <div className="detail-grid single-column-grid">
          <RequestProgressPanel request={request} />

          <section className="panel-card">
            <div className="panel-head split">
              <div>
                <div className="panel-kicker">UPLOADS</div>
                <h2>업로드 파일</h2>
              </div>
            </div>
            <div className="detail-list-grid">
              {request.files.map((file) => (
                <div className="file-pill" key={file.path}>
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
