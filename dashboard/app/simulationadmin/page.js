import Link from 'next/link'
import AdminSubmitForm from '@/components/admin-submit-form'

export const dynamic = 'force-dynamic'

export default function SimulationAdminPage() {
  return (
    <main>
      <div className="page-shell report-page">
        <section className="hero-shell detail-hero">
          <div className="hero-copy">
            <div className="tag-row">
              <span className="orange-tag">ADMIN ONLY</span>
              <span className="version-text">/simulationadmin</span>
            </div>
            <h1 className="main-title small-title">최소 입력 관리자 제출 화면</h1>
            <p className="hero-lead">
              비밀번호, 업로드 파일, 프롬프트만 받는 간단한 관리자 화면이야. 실제 MiroFish 실행과 공개 리포트 게시 상태는
              모두 공개 대시보드에서 확인할 수 있어.
            </p>
            <div className="hero-links">
              <Link href="/" className="btn secondary">← 공개 대시보드</Link>
            </div>
          </div>
        </section>

        <section className="panel-card form-panel">
          <div className="panel-head">
            <div>
              <div className="panel-kicker">SUBMIT</div>
              <h2>새 시뮬레이션 요청 등록</h2>
            </div>
          </div>
          <AdminSubmitForm />
        </section>
      </div>
    </main>
  )
}
