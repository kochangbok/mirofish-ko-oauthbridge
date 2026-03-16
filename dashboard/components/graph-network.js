'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { normalizeDashboardText, translateDashboardIdentifier } from '@/lib/dashboard-text'

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function getEntityTypes(nodes) {
  const typeMap = {}
  const colors = ['#FF6B35', '#004E89', '#7B2D8E', '#1A936F', '#C5283D', '#E9724C', '#3498db', '#9b59b6', '#27ae60', '#f39c12']

  for (const node of nodes || []) {
      const type = node.labels?.find((label) => label !== 'Entity') || 'Entity'
    if (!typeMap[type]) {
      typeMap[type] = {
        name: type,
        count: 0,
        color: colors[Object.keys(typeMap).length % colors.length]
      }
    }
    typeMap[type].count += 1
  }

  return Object.values(typeMap)
}

export default function GraphNetwork({ graph }) {
  const graphContainer = useRef(null)
  const graphSvg = useRef(null)
  const simulationRef = useRef(null)
  const zoomBehaviorRef = useRef(null)
  const resizeTimerRef = useRef(null)

  const [selectedItem, setSelectedItem] = useState(null)
  const [showEdgeLabels, setShowEdgeLabels] = useState(true)

  const nodesData = graph?.nodes || []
  const edgesData = graph?.edges || []
  const entityTypes = useMemo(() => getEntityTypes(nodesData), [nodesData])

  const renderGraph = useCallback(() => {
    if (!graphSvg.current || !graphContainer.current || !nodesData.length) return

    if (simulationRef.current) simulationRef.current.stop()

    const container = graphContainer.current
    const width = Math.max(container.clientWidth || 0, 960)
    const height = Math.max(container.clientHeight || 0, 760)

    const svg = d3.select(graphSvg.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

    svg.selectAll('*').remove()

    const nodeMap = {}
    nodesData.forEach((node) => {
      nodeMap[node.uuid] = node
    })

    const nodes = nodesData.map((node) => ({
      id: node.uuid,
      name: node.name || '이름 없음',
      type: node.labels?.find((label) => label !== 'Entity') || 'Entity',
      rawData: node
    }))

    const nodeIds = new Set(nodes.map((node) => node.id))

    const edgePairCount = {}
    const selfLoopEdges = {}
    const tempEdges = edgesData.filter((edge) => nodeIds.has(edge.source_node_uuid) && nodeIds.has(edge.target_node_uuid))

    tempEdges.forEach((edge) => {
      if (edge.source_node_uuid === edge.target_node_uuid) {
        if (!selfLoopEdges[edge.source_node_uuid]) selfLoopEdges[edge.source_node_uuid] = []
        selfLoopEdges[edge.source_node_uuid].push({
          ...edge,
          source_name: nodeMap[edge.source_node_uuid]?.name,
          target_name: nodeMap[edge.target_node_uuid]?.name
        })
      } else {
        const pairKey = [edge.source_node_uuid, edge.target_node_uuid].sort().join('_')
        edgePairCount[pairKey] = (edgePairCount[pairKey] || 0) + 1
      }
    })

    const edgePairIndex = {}
    const processedSelfLoopNodes = new Set()
    const edges = []

    tempEdges.forEach((edge) => {
      const isSelfLoop = edge.source_node_uuid === edge.target_node_uuid

      if (isSelfLoop) {
        if (processedSelfLoopNodes.has(edge.source_node_uuid)) return
        processedSelfLoopNodes.add(edge.source_node_uuid)

        const allSelfLoops = selfLoopEdges[edge.source_node_uuid]
        const nodeName = nodeMap[edge.source_node_uuid]?.name || '알 수 없음'

        edges.push({
          source: edge.source_node_uuid,
          target: edge.target_node_uuid,
          type: 'SELF_LOOP',
          name: `Self Relations (${allSelfLoops.length})`,
          curvature: 0,
          isSelfLoop: true,
          rawData: {
            isSelfLoopGroup: true,
            source_name: nodeName,
            target_name: nodeName,
            selfLoopCount: allSelfLoops.length,
            selfLoopEdges: allSelfLoops
          }
        })
        return
      }

      const pairKey = [edge.source_node_uuid, edge.target_node_uuid].sort().join('_')
      const totalCount = edgePairCount[pairKey]
      const currentIndex = edgePairIndex[pairKey] || 0
      edgePairIndex[pairKey] = currentIndex + 1

      const isReversed = edge.source_node_uuid > edge.target_node_uuid
      let curvature = 0

      if (totalCount > 1) {
        const curvatureRange = Math.min(1.2, 0.6 + totalCount * 0.15)
        curvature = ((currentIndex / (totalCount - 1)) - 0.5) * curvatureRange * 2
        if (isReversed) curvature = -curvature
      }

      edges.push({
        source: edge.source_node_uuid,
        target: edge.target_node_uuid,
        type: edge.fact_type || edge.name || 'RELATED',
        name: edge.name || edge.fact_type || 'RELATED',
        curvature,
        isSelfLoop: false,
        pairIndex: currentIndex,
        pairTotal: totalCount,
        rawData: {
          ...edge,
          source_name: nodeMap[edge.source_node_uuid]?.name,
          target_name: nodeMap[edge.target_node_uuid]?.name
        }
      })
    })

    const colorMap = {}
    entityTypes.forEach((type) => {
      colorMap[type.name] = type.color
    })
    const getColor = (type) => colorMap[type] || '#999'

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((node) => node.id).distance((edge) => {
        const baseDistance = 150
        const edgeCount = edge.pairTotal || 1
        return baseDistance + (edgeCount - 1) * 50
      }))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(50))
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04))

    simulationRef.current = simulation

    const g = svg.append('g')

    const zoomBehavior = d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    zoomBehaviorRef.current = zoomBehavior
    svg.call(zoomBehavior)

    const linkGroup = g.append('g').attr('class', 'links')

    const getLinkPath = (edge) => {
      const sx = edge.source.x
      const sy = edge.source.y
      const tx = edge.target.x
      const ty = edge.target.y

      if (edge.isSelfLoop) {
        const loopRadius = 30
        const x1 = sx + 8
        const y1 = sy - 4
        const x2 = sx + 8
        const y2 = sy + 4
        return `M${x1},${y1} A${loopRadius},${loopRadius} 0 1,1 ${x2},${y2}`
      }

      if (edge.curvature === 0) {
        return `M${sx},${sy} L${tx},${ty}`
      }

      const dx = tx - sx
      const dy = ty - sy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const pairTotal = edge.pairTotal || 1
      const offsetRatio = 0.25 + pairTotal * 0.05
      const baseOffset = Math.max(35, dist * offsetRatio)
      const offsetX = -dy / dist * edge.curvature * baseOffset
      const offsetY = dx / dist * edge.curvature * baseOffset
      const cx = (sx + tx) / 2 + offsetX
      const cy = (sy + ty) / 2 + offsetY

      return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`
    }

    const getLinkMidpoint = (edge) => {
      const sx = edge.source.x
      const sy = edge.source.y
      const tx = edge.target.x
      const ty = edge.target.y

      if (edge.isSelfLoop) return { x: sx + 70, y: sy }
      if (edge.curvature === 0) return { x: (sx + tx) / 2, y: (sy + ty) / 2 }

      const dx = tx - sx
      const dy = ty - sy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const pairTotal = edge.pairTotal || 1
      const offsetRatio = 0.25 + pairTotal * 0.05
      const baseOffset = Math.max(35, dist * offsetRatio)
      const offsetX = -dy / dist * edge.curvature * baseOffset
      const offsetY = dx / dist * edge.curvature * baseOffset
      const cx = (sx + tx) / 2 + offsetX
      const cy = (sy + ty) / 2 + offsetY

      return {
        x: 0.25 * sx + 0.5 * cx + 0.25 * tx,
        y: 0.25 * sy + 0.5 * cy + 0.25 * ty
      }
    }

    const link = linkGroup.selectAll('path')
      .data(edges)
      .enter()
      .append('path')
      .attr('stroke', '#C0C0C0')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')
      .style('cursor', 'pointer')
      .on('click', (event, edge) => {
        event.stopPropagation()
        linkGroup.selectAll('path').attr('stroke', '#C0C0C0').attr('stroke-width', 1.5)
        linkLabelBg.attr('fill', 'rgba(255,255,255,0.95)')
        linkLabels.attr('fill', '#666')
        d3.select(event.target).attr('stroke', '#3498db').attr('stroke-width', 3)
        setSelectedItem({ type: 'edge', data: edge.rawData })
      })

    const linkLabelBg = linkGroup.selectAll('rect')
      .data(edges)
      .enter()
      .append('rect')
      .attr('fill', 'rgba(255,255,255,0.95)')
      .attr('rx', 3)
      .attr('ry', 3)
      .style('cursor', 'pointer')
      .style('pointer-events', 'all')
      .style('display', showEdgeLabels ? 'block' : 'none')
      .on('click', (event, edge) => {
        event.stopPropagation()
        linkGroup.selectAll('path').attr('stroke', '#C0C0C0').attr('stroke-width', 1.5)
        linkLabelBg.attr('fill', 'rgba(255,255,255,0.95)')
        linkLabels.attr('fill', '#666')
        link.filter((item) => item === edge).attr('stroke', '#3498db').attr('stroke-width', 3)
        d3.select(event.target).attr('fill', 'rgba(52, 152, 219, 0.1)')
        setSelectedItem({ type: 'edge', data: edge.rawData })
      })

    const linkLabels = linkGroup.selectAll('text')
      .data(edges)
      .enter()
      .append('text')
      .text((edge) => edge.name)
      .attr('font-size', '9px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('cursor', 'pointer')
      .style('pointer-events', 'all')
      .style('font-family', 'system-ui, sans-serif')
      .style('display', showEdgeLabels ? 'block' : 'none')
      .on('click', (event, edge) => {
        event.stopPropagation()
        linkGroup.selectAll('path').attr('stroke', '#C0C0C0').attr('stroke-width', 1.5)
        linkLabelBg.attr('fill', 'rgba(255,255,255,0.95)')
        linkLabels.attr('fill', '#666')
        link.filter((item) => item === edge).attr('stroke', '#3498db').attr('stroke-width', 3)
        d3.select(event.target).attr('fill', '#3498db')
        setSelectedItem({ type: 'edge', data: edge.rawData })
      })

    const nodeGroup = g.append('g').attr('class', 'nodes')

    const node = nodeGroup.selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', (item) => getColor(item.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, item) => {
            item.fx = item.x
            item.fy = item.y
            item._dragStartX = event.x
            item._dragStartY = event.y
            item._isDragging = false
          })
          .on('drag', (event, item) => {
            const dx = event.x - item._dragStartX
            const dy = event.y - item._dragStartY
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (!item._isDragging && distance > 3) {
              item._isDragging = true
              simulation.alphaTarget(0.3).restart()
            }

            if (item._isDragging) {
              item.fx = event.x
              item.fy = event.y
            }
          })
          .on('end', (_event, item) => {
            if (item._isDragging) simulation.alphaTarget(0)
            item.fx = null
            item.fy = null
            item._isDragging = false
          })
      )
      .on('click', (event, item) => {
        event.stopPropagation()
        node.attr('stroke', '#fff').attr('stroke-width', 2.5)
        linkGroup.selectAll('path').attr('stroke', '#C0C0C0').attr('stroke-width', 1.5)
        d3.select(event.target).attr('stroke', '#E91E63').attr('stroke-width', 4)
        link
          .filter((edge) => edge.source.id === item.id || edge.target.id === item.id)
          .attr('stroke', '#E91E63')
          .attr('stroke-width', 2.5)

        setSelectedItem({
          type: 'node',
          data: item.rawData,
          entityType: item.type,
          color: getColor(item.type)
        })
      })
      .on('mouseenter', (event) => {
        d3.select(event.target).attr('stroke', '#333').attr('stroke-width', 3)
      })
      .on('mouseleave', (event) => {
        d3.select(event.target).attr('stroke', '#fff').attr('stroke-width', 2.5)
      })

    const nodeLabels = nodeGroup.selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((item) => (item.name.length > 8 ? `${item.name.substring(0, 8)}…` : item.name))
      .attr('font-size', '11px')
      .attr('fill', '#333')
      .attr('font-weight', '500')
      .attr('dx', 14)
      .attr('dy', 4)
      .style('pointer-events', 'none')
      .style('font-family', 'system-ui, sans-serif')

    simulation.on('tick', () => {
      link.attr('d', (edge) => getLinkPath(edge))

      linkLabels.each(function(edge) {
        const mid = getLinkMidpoint(edge)
        d3.select(this)
          .attr('x', mid.x)
          .attr('y', mid.y)
          .attr('transform', '')
      })

      linkLabelBg.each(function(edge, index) {
        const mid = getLinkMidpoint(edge)
        const textEl = linkLabels.nodes()[index]
        const bbox = textEl.getBBox()
        d3.select(this)
          .attr('x', mid.x - bbox.width / 2 - 4)
          .attr('y', mid.y - bbox.height / 2 - 2)
          .attr('width', bbox.width + 8)
          .attr('height', bbox.height + 4)
          .attr('transform', '')
      })

      node.attr('cx', (item) => item.x).attr('cy', (item) => item.y)
      nodeLabels.attr('x', (item) => item.x).attr('y', (item) => item.y)
    })

    svg.on('click', () => {
      setSelectedItem(null)
      node.attr('stroke', '#fff').attr('stroke-width', 2.5)
      linkGroup.selectAll('path').attr('stroke', '#C0C0C0').attr('stroke-width', 1.5)
      linkLabelBg.attr('fill', 'rgba(255,255,255,0.95)')
      linkLabels.attr('fill', '#666')
    })
  }, [nodesData, edgesData, entityTypes, showEdgeLabels])

  useEffect(() => {
    renderGraph()

    const handleResize = () => {
      window.clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = window.setTimeout(() => renderGraph(), 80)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(resizeTimerRef.current)
      if (simulationRef.current) simulationRef.current.stop()
    }
  }, [renderGraph])

  if (!nodesData.length) {
    return <div className="graph-empty">표시할 그래프 노드가 아직 없어.</div>
  }

  return (
    <div className="mf-graph-panel">
      <div className="mf-graph-panel-header">
        <span className="mf-graph-panel-title">Relation Graph</span>
        <div className="mf-header-tools">
          <button
            className="mf-tool-btn"
            type="button"
            onClick={() => {
              if (!graphSvg.current || !zoomBehaviorRef.current) return
              d3.select(graphSvg.current).transition().duration(300).call(zoomBehaviorRef.current.transform, d3.zoomIdentity)
            }}
          >
            <span className="mf-icon-refresh">↻</span>
            <span className="mf-btn-text">초기화</span>
          </button>
        </div>
      </div>

      <div className="mf-graph-container" ref={graphContainer}>
        <div className="mf-graph-view">
          <svg ref={graphSvg} className="mf-graph-svg" />

          {selectedItem ? (
            <div className="mf-detail-panel">
              <div className="mf-detail-panel-header">
                <span className="mf-detail-title">{selectedItem.type === 'node' ? '노드 상세' : '관계 상세'}</span>
                {selectedItem.type === 'node' ? (
                  <span className="mf-detail-type-badge" style={{ background: selectedItem.color, color: '#fff' }}>
                    {selectedItem.entityType}
                  </span>
                ) : null}
                <button className="mf-detail-close" type="button" onClick={() => setSelectedItem(null)}>×</button>
              </div>

              <div className="mf-detail-content">
                {selectedItem.type === 'node' ? (
                  <>
                    <div className="mf-detail-row">
                      <span className="mf-detail-label">이름:</span>
                      <span className="mf-detail-value">{selectedItem.data.name}</span>
                    </div>
                    <div className="mf-detail-row">
                      <span className="mf-detail-label">UUID:</span>
                      <span className="mf-detail-value mf-uuid-text">{selectedItem.data.uuid}</span>
                    </div>
                    {selectedItem.data.created_at ? (
                      <div className="mf-detail-row">
                        <span className="mf-detail-label">생성:</span>
                        <span className="mf-detail-value">{formatDateTime(selectedItem.data.created_at)}</span>
                      </div>
                    ) : null}

                    {selectedItem.data.attributes && Object.keys(selectedItem.data.attributes).length > 0 ? (
                      <div className="mf-detail-section">
                        <div className="mf-section-title">속성</div>
                        <div className="mf-properties-list">
                          {Object.entries(selectedItem.data.attributes).map(([key, value]) => (
                            <div className="mf-property-item" key={key}>
                              <span className="mf-property-key">{key}:</span>
                              <span className="mf-property-value">{`${value || '-'}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedItem.data.summary ? (
                      <div className="mf-detail-section">
                        <div className="mf-section-title">요약</div>
                        <div className="mf-summary-text">{normalizeDashboardText(selectedItem.data.summary)}</div>
                      </div>
                    ) : null}

                    {selectedItem.data.labels?.length ? (
                      <div className="mf-detail-section">
                        <div className="mf-section-title">라벨</div>
                        <div className="mf-labels-list">
                          {selectedItem.data.labels.map((label) => (
                            <span key={label} className="mf-label-tag">{translateDashboardIdentifier(label)}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : selectedItem.data.isSelfLoopGroup ? (
                  <>
                    <div className="mf-edge-relation-header">
                      {selectedItem.data.source_name} - 자기 관계
                      <span className="mf-self-loop-count">{selectedItem.data.selfLoopCount}개</span>
                    </div>

                    <div className="mf-self-loop-list">
                      {selectedItem.data.selfLoopEdges.map((loop, index) => (
                        <div key={loop.uuid || index} className="mf-self-loop-item">
                          <div className="mf-self-loop-item-header">
                            <span className="mf-self-loop-index">#{index + 1}</span>
                            <span className="mf-self-loop-name">{translateDashboardIdentifier(loop.name || loop.fact_type || 'RELATED_TO')}</span>
                          </div>
                          <div className="mf-self-loop-item-content">
                            {loop.uuid ? (
                              <div className="mf-detail-row">
                                <span className="mf-detail-label">UUID:</span>
                                <span className="mf-detail-value mf-uuid-text">{loop.uuid}</span>
                              </div>
                            ) : null}
                            {loop.fact ? (
                              <div className="mf-detail-row">
                                <span className="mf-detail-label">사실:</span>
                                <span className="mf-detail-value mf-fact-text">{normalizeDashboardText(loop.fact)}</span>
                              </div>
                            ) : null}
                            {loop.fact_type ? (
                              <div className="mf-detail-row">
                                <span className="mf-detail-label">유형:</span>
                                <span className="mf-detail-value">{translateDashboardIdentifier(loop.fact_type)}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mf-edge-relation-header">
                      {selectedItem.data.source_name} → {translateDashboardIdentifier(selectedItem.data.name || 'RELATED_TO')} → {selectedItem.data.target_name}
                    </div>
                    <div className="mf-detail-row">
                      <span className="mf-detail-label">UUID:</span>
                      <span className="mf-detail-value mf-uuid-text">{selectedItem.data.uuid}</span>
                    </div>
                    <div className="mf-detail-row">
                      <span className="mf-detail-label">라벨:</span>
                      <span className="mf-detail-value">{translateDashboardIdentifier(selectedItem.data.name || 'RELATED_TO')}</span>
                    </div>
                    <div className="mf-detail-row">
                      <span className="mf-detail-label">유형:</span>
                      <span className="mf-detail-value">{translateDashboardIdentifier(selectedItem.data.fact_type || '알 수 없음')}</span>
                    </div>
                    {selectedItem.data.fact ? (
                      <div className="mf-detail-row">
                        <span className="mf-detail-label">사실:</span>
                        <span className="mf-detail-value mf-fact-text">{normalizeDashboardText(selectedItem.data.fact)}</span>
                      </div>
                    ) : null}
                    {selectedItem.data.created_at ? (
                      <div className="mf-detail-row">
                        <span className="mf-detail-label">생성:</span>
                        <span className="mf-detail-value">{formatDateTime(selectedItem.data.created_at)}</span>
                      </div>
                    ) : null}
                    {selectedItem.data.valid_at ? (
                      <div className="mf-detail-row">
                        <span className="mf-detail-label">유효 시작:</span>
                        <span className="mf-detail-value">{formatDateTime(selectedItem.data.valid_at)}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {entityTypes.length ? (
        <div className="mf-graph-legend">
          <span className="mf-legend-title">엔터티 유형</span>
          <div className="mf-legend-items">
            {entityTypes.map((type) => (
              <div className="mf-legend-item" key={type.name}>
                <span className="mf-legend-dot" style={{ background: type.color }} />
                <span className="mf-legend-label">{translateDashboardIdentifier(type.name)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mf-edge-labels-toggle">
        <label className="mf-toggle-switch">
          <input type="checkbox" checked={showEdgeLabels} onChange={(event) => setShowEdgeLabels(event.target.checked)} />
          <span className="mf-slider" />
        </label>
        <span className="mf-toggle-label">관계 라벨 표시</span>
      </div>
    </div>
  )
}
