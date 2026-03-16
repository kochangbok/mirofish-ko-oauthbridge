const STAGES = [
  { id: 'queued', label: '01 요청 접수', desc: '관리자 비밀번호 검증과 파일 업로드가 완료된 상태' },
  { id: 'ontology', label: '02 온톨로지 생성', desc: '문서 분석과 schema 생성 단계' },
  { id: 'prepare', label: '03 환경 구성', desc: 'Agent profile / config 생성 단계' },
  { id: 'simulation', label: '04 시뮬레이션 실행', desc: '로컬 MiroFish runner 실행 단계' },
  { id: 'report', label: '05 보고서 생성', desc: 'Report Agent가 리포트를 작성하는 단계' },
  { id: 'completed', label: '06 게시 완료', desc: '공개 리포트 페이지에 게시된 상태' }
]

function stepState(request, stageId, index) {
  if (request.status === 'failed') return request.progress?.stage === stageId ? 'failed' : index === 0 ? 'completed' : 'pending'
  const current = STAGES.findIndex((stage) => stage.id === (request.progress?.stage || request.status))
  if (current > index) return 'completed'
  if (current === index) return request.status === 'completed' && stageId === 'completed' ? 'completed' : 'processing'
  if (request.status === 'completed' && stageId === 'completed') return 'completed'
  return 'pending'
}

export default function RequestProgressPanel({ request }) {
  return (
    <section className="panel-card">
      <div className="panel-head">
        <div>
          <div className="panel-kicker">REQUEST WORKBENCH</div>
          <h2>공개 요청 진행 상태</h2>
          <p className="muted">관리자 화면은 최소 입력만 받고, 나머지 진행 상황은 누구나 추적할 수 있게 공개돼.</p>
        </div>
      </div>

      <div className="workflow-stack compact-stack">
        {STAGES.map((stage, index) => {
          const state = stepState(request, stage.id, index)
          return (
            <details className={`workflow-card mini status-${state}`} key={stage.id} open>
              <summary className="workflow-summary">
                <div className="workflow-summary-main">
                  <div className="workflow-step-pill small">{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <div className="workflow-summary-title">{stage.label}</div>
                    <div className="workflow-summary-desc">{stage.desc}</div>
                  </div>
                </div>
                <div className="workflow-summary-side">
                  <span className={`badge status-${state}`}>{state === 'completed' ? '완료' : state === 'processing' ? '진행 중' : state === 'failed' ? '오류' : '대기'}</span>
                </div>
              </summary>
              <div className="workflow-body">
                <p className="workflow-summary-copy">
                  {request.progress?.stage === stage.id ? request.progress?.message : state === 'completed' ? '이 단계는 이미 완료되었어.' : '아직 이 단계 전이야.'}
                </p>
              </div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
