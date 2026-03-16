import GraphNetwork from '@/components/graph-network'
import { normalizeDashboardText, translateDashboardIdentifier } from '@/lib/dashboard-text'
import { formatBytes } from '@/lib/utils'

function PreviewTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.uuid || row.label || row.name || `${index}`}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ReportGraphPanel({ graph }) {
  if (!graph) {
    return (
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <div className="panel-kicker">그래프</div>
            <h2>그래프 아티팩트가 아직 게시되지 않았어.</h2>
          </div>
        </div>
      </section>
    )
  }

  const entityTypes = graph.ontology?.entityTypes || []
  const relationTypes = graph.ontology?.relationTypes || []
  const previewNodes = graph.nodes?.slice(0, 18) || []
  const previewEdges = graph.edges?.slice(0, 18) || []

  return (
    <section className="panel-card">
      <div className="panel-head split">
        <div>
          <div className="panel-kicker">그래프</div>
          <h2>그래프 결과와 스키마 미리보기</h2>
          <p className="muted">Zep 그래프에서 수집한 노드/엣지 통계와 온톨로지 스키마를 함께 공개해.</p>
        </div>
        <div className="meta-list">
          <span className="badge">그래프 {graph.graphId || '—'}</span>
          <span className="badge">노드 {graph.nodeCount || 0}</span>
          <span className="badge">엣지 {graph.edgeCount || 0}</span>
          <span className="badge">스키마 {graph.schemaTypeCount || 0}</span>
        </div>
      </div>

      <div className="metrics-grid graph-overview">
        <div className="metric-card accent">
          <div className="metric-value">{graph.nodeCount || 0}</div>
          <div className="metric-label">엔터티 노드</div>
        </div>
        <div className="metric-card accent">
          <div className="metric-value">{graph.edgeCount || 0}</div>
          <div className="metric-label">관계 엣지</div>
        </div>
        <div className="metric-card accent">
          <div className="metric-value">{entityTypes.length + relationTypes.length}</div>
          <div className="metric-label">스키마 유형</div>
        </div>
        <div className="metric-card accent">
          <div className="metric-value">{formatBytes(graph.uploadedFiles?.reduce((sum, file) => sum + (file.size || 0), 0) || 0)}</div>
          <div className="metric-label">업로드 용량</div>
        </div>
      </div>

      {graph.analysisSummary ? <div className="notice soft">{normalizeDashboardText(graph.analysisSummary)}</div> : null}

      <details className="detail-card" open>
        <summary>관계 그래프 보기</summary>
        <GraphNetwork graph={graph} />
      </details>

      <div className="details-stack two-col">
        <details className="detail-card" open>
          <summary>엔터티 유형</summary>
          <div className="tag-list roomy">
            {entityTypes.map((item) => <span key={item.name} className="tag-chip emphasis">{translateDashboardIdentifier(item.name)}</span>)}
          </div>
        </details>

        <details className="detail-card" open>
          <summary>관계 유형</summary>
          <div className="tag-list roomy">
            {relationTypes.map((item) => <span key={item.name} className="tag-chip">{translateDashboardIdentifier(item.name)}</span>)}
          </div>
        </details>

        <details className="detail-card" open>
          <summary>노드 라벨 분포</summary>
          <div className="pill-grid">
            {(graph.labelCounts || []).slice(0, 20).map((item) => (
              <div className="mini-stat" key={item.label}>
                <strong>{item.count}</strong>
                <span>{translateDashboardIdentifier(item.label)}</span>
              </div>
            ))}
          </div>
        </details>

        <details className="detail-card" open>
          <summary>관계 분포</summary>
          <div className="pill-grid">
            {(graph.relationCounts || []).slice(0, 20).map((item) => (
              <div className="mini-stat" key={item.label}>
                <strong>{item.count}</strong>
                <span>{translateDashboardIdentifier(item.label)}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="details-stack">
        <details className="detail-card" open>
          <summary>노드 미리보기 ({previewNodes.length}/{graph.nodeCount || 0})</summary>
          <PreviewTable
            columns={[
              { key: 'name', label: '이름' },
              { key: 'labels', label: '라벨', render: (row) => (row.labels || []).map((label) => translateDashboardIdentifier(label)).join(', ') || '—' },
              { key: 'summary', label: '요약', render: (row) => normalizeDashboardText(row.summary) || '—' }
            ]}
            rows={previewNodes}
          />
        </details>

        <details className="detail-card" open>
          <summary>엣지 미리보기 ({previewEdges.length}/{graph.edgeCount || 0})</summary>
          <PreviewTable
            columns={[
              { key: 'fact_type', label: '관계', render: (row) => translateDashboardIdentifier(row.fact_type) || '—' },
              { key: 'source_node_name', label: '출발 노드' },
              { key: 'target_node_name', label: '도착 노드' },
              { key: 'fact', label: '사실' , render: (row) => normalizeDashboardText(row.fact) || '—' }
            ]}
            rows={previewEdges}
          />
        </details>
      </div>
    </section>
  )
}
